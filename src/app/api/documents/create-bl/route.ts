import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { createBLFromDocSchema } from "@/lib/validation";
import { createDeliveryNote } from "@/lib/services/delivery";
import { createAuditEvent } from "@/lib/services/audit";
import { prisma } from "@/lib/prisma";
import { canAccessDocument } from "@/lib/authorization";

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

    if (!await canAccessDocument(user, parsed.data.documentId)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const sourceDoc = await prisma.document.findUnique({
      where: { id: parsed.data.documentId },
      include: { items: true },
    });
    if (!sourceDoc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    const existingBL = await prisma.deliveryNote.findFirst({
      where: { documentId: sourceDoc.id },
    });
    if (existingBL) {
      return NextResponse.json({ error: "Un bon de livraison existe déjà pour ce document", existingBlId: existingBL.id }, { status: 409 });
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
    return apiServerError(error, "POST /api/documents/create-bl");
  }
}
