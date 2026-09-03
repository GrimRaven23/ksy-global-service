import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { createBLFromDocSchema } from "@/lib/validation";
import { createDeliveryNote } from "@/lib/services/delivery";
import { getDocument } from "@/lib/services/documents";
import { createAuditEvent } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "delivery.create")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createBLFromDocSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID document requis" }, { status: 400 });
    }

    const sourceDoc = await getDocument(parsed.data.documentId);
    if (!sourceDoc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    const note = await createDeliveryNote({
      customerId: sourceDoc.customerId,
      customerName: sourceDoc.customerName ?? undefined,
      customerAddr: sourceDoc.customerAddr ?? undefined,
      customerPhone: sourceDoc.customerPhone ?? undefined,
      customerEmail: sourceDoc.customerEmail ?? undefined,
      documentId: sourceDoc.id,
      orderRef: sourceDoc.ref ?? undefined,
      items: sourceDoc.items.map((item) => ({
        designation: item.designation,
        quantity: Number(item.quantity),
        observation: "",
      })),
      userId: user.id,
    });

    await createAuditEvent({
      action: "DELIVERY_NOTE_CREATED",
      entityType: "delivery_note",
      entityId: note.id,
      entityNum: note.num,
      userId: user.id,
      details: { sourceDocumentId: sourceDoc.id, sourceDocumentNum: sourceDoc.num },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/documents/create-bl error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}
