import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { deliveryCreateSchema, deliveryUpdateSchema } from "@/lib/validation";
import { createDeliveryNote, updateDeliveryNote, listDeliveryNotes, deleteDeliveryNote } from "@/lib/services/delivery";
import { createAuditEvent } from "@/lib/services/audit";

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "delivery.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const notes = await listDeliveryNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/delivery error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "delivery.create")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = deliveryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const note = await createDeliveryNote({ ...parsed.data, userId: user.id });

    await createAuditEvent({
      action: "DELIVERY_NOTE_CREATED",
      entityType: "delivery_note",
      entityId: note.id,
      entityNum: note.num,
      userId: user.id,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/delivery error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "delivery.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const body = await request.json();
    const parsed = deliveryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const note = await updateDeliveryNote(id, parsed.data);

    await createAuditEvent({
      action: "DELIVERY_NOTE_UPDATED",
      entityType: "delivery_note",
      entityId: note.id,
      entityNum: note.num,
      userId: user.id,
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("PUT /api/delivery error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "delivery.delete")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const note = await deleteDeliveryNote(id);

    await createAuditEvent({
      action: "DELIVERY_NOTE_DELETED",
      entityType: "delivery_note",
      entityId: note.id,
      entityNum: note.num,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/delivery error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
