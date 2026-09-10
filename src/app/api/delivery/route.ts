import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { deliveryCreateSchema, deliveryUpdateSchema } from "@/lib/validation";
import { createDeliveryNote, updateDeliveryNote, listDeliveryNotes, deleteDeliveryNote, getDeliveryNote } from "@/lib/services/delivery";
import { createAuditEvent } from "@/lib/services/audit";
import { canAccessDeliveryNote, canEditDeliveryNote, canConfirmDeliveryNote } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "delivery.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      if (!await canAccessDeliveryNote(user, id)) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const note = await getDeliveryNote(id);
      if (!note) return NextResponse.json({ error: "Bon de livraison non trouvé" }, { status: 404 });
      return NextResponse.json(note);
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const result = await listDeliveryNotes(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    return apiServerError(error, "GET /api/delivery");
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
  } catch (error: unknown) {
    return apiServerError(error, "POST /api/delivery");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (!await canAccessDeliveryNote(user, id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const existing = await prisma.deliveryNote.findUnique({ where: { id }, select: { status: true, num: true } });
    if (!existing) return NextResponse.json({ error: "Bon de livraison non trouvé" }, { status: 404 });

    const body = await request.json();
    const parsed = deliveryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const newStatusRaw = parsed.data.status;
    const newStatus = newStatusRaw === "FINALIZED" ? "EMISE" : newStatusRaw;
    const hasContentFields =
      parsed.data.date !== undefined ||
      parsed.data.observations !== undefined ||
      parsed.data.driverName !== undefined ||
      parsed.data.driverPhone !== undefined ||
      parsed.data.orderRef !== undefined ||
      parsed.data.customerId !== undefined ||
      parsed.data.customerName !== undefined ||
      parsed.data.customerAddr !== undefined ||
      parsed.data.customerPhone !== undefined ||
      parsed.data.customerEmail !== undefined ||
      parsed.data.items !== undefined;

    if (newStatus && newStatus !== existing.status) {
      if (hasContentFields) {
        return NextResponse.json({ error: "Transition de statut et modification de contenu interdites simultanément" }, { status: 400 });
      }
      if (newStatus === "EMISE") {
        if (!hasPermission(user.role, "delivery.confirm")) {
          return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }
        if (!canConfirmDeliveryNote(existing.status)) {
          return NextResponse.json({ error: "Ce bon de livraison ne peut pas être confirmé" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: `Transition de statut invalide: ${existing.status} → ${newStatus}` }, { status: 403 });
      }
    }

    if (!newStatus && !canEditDeliveryNote(existing.status)) {
      return NextResponse.json({ error: "Ce bon de livraison ne peut plus être modifié" }, { status: 403 });
    }

    if ((hasContentFields || !newStatus || newStatus === existing.status) && !hasPermission(user.role, "delivery.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const note = await updateDeliveryNote(id, { ...parsed.data, ...(newStatus ? { status: newStatus } : {}) }, { changedBy: user.id });

    let auditAction = "DELIVERY_NOTE_UPDATED";
    if (newStatus === "EMISE" && existing.status !== "EMISE") {
      auditAction = "DELIVERY_NOTE_CONFIRMED";
    }

    await createAuditEvent({
      action: auditAction as any,
      entityType: "delivery_note",
      entityId: note.id,
      entityNum: note.num,
      userId: user.id,
      details: newStatus !== existing.status ? { from: existing.status, to: newStatus } : undefined,
    });

    return NextResponse.json(note);
  } catch (error: unknown) {
    return apiServerError(error, "PUT /api/delivery");
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

    if (!await canAccessDeliveryNote(user, id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const existingNote = await prisma.deliveryNote.findUnique({ where: { id }, select: { status: true, num: true } });
    if (!existingNote) return NextResponse.json({ error: "Bon de livraison non trouvé" }, { status: 404 });

    if (existingNote.status !== "DRAFT") {
      return NextResponse.json({ error: "Seuls les brouillons peuvent être supprimés" }, { status: 403 });
    }

    const note = await deleteDeliveryNote(id);

    await createAuditEvent({
      action: "DELIVERY_NOTE_DELETED",
      entityType: "delivery_note",
      entityId: note.id,
      entityNum: note.num,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return apiServerError(error, "DELETE /api/delivery");
  }
}
