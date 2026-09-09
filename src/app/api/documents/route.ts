import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validation";
import { createDocument, updateDocument, listDocuments, deleteDocument, getDocument } from "@/lib/services/documents";
import { createAuditEvent } from "@/lib/services/audit";
import { canAccessDocument, canEditDocument, canDeleteDocument, canFinalizeDocument, canCancelDocument } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "documents.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      if (!await canAccessDocument(user, id)) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const doc = await getDocument(id);
      if (!doc) return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
      return NextResponse.json(doc);
    }

    const type = searchParams.get("type") || undefined;
    if (type && !["PROFORMA", "DEFINITIVE"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const result = await listDocuments(type, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "documents.create")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = documentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const doc = await createDocument({
      ...parsed.data,
      userId: user.id,
      ref: parsed.data.ref ?? undefined,
      customerId: parsed.data.customerId ?? undefined,
      validity: parsed.data.validity ?? undefined,
    });

    await createAuditEvent({
      action: "DOCUMENT_CREATED",
      entityType: "document",
      entityId: doc.id,
      entityNum: doc.num,
      userId: user.id,
      details: { type: doc.type },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "documents.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (!await canAccessDocument(user, id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const existing = await prisma.document.findUnique({ where: { id }, select: { status: true, num: true } });
    if (!existing) return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });

    const body = await request.json();
    const parsed = documentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const newStatus = parsed.data.status;
    if (newStatus && newStatus !== existing.status) {
      if (newStatus === "EMISE") {
        if (!canFinalizeDocument(existing.status)) {
          return NextResponse.json({ error: "Ce document ne peut pas être finalisé depuis son état actuel" }, { status: 403 });
        }
      } else if (newStatus === "CANCELLED") {
        if (!canCancelDocument(existing.status)) {
          return NextResponse.json({ error: "Ce document ne peut pas être annulé" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: `Transition de statut invalide: ${existing.status} → ${newStatus}` }, { status: 403 });
      }
    }

    if (!newStatus && !canEditDocument(existing.status)) {
      return NextResponse.json({ error: "Ce document ne peut plus être modifié" }, { status: 403 });
    }

    const doc = await updateDocument(id, parsed.data);

    let auditAction = "DOCUMENT_UPDATED";
    if (newStatus === "EMISE" && existing.status !== "EMISE") {
      auditAction = "DOCUMENT_FINALIZED";
    } else if (newStatus === "CANCELLED" && existing.status !== "CANCELLED") {
      auditAction = "DOCUMENT_CANCELLED";
    }

    await createAuditEvent({
      action: auditAction as any,
      entityType: "document",
      entityId: doc.id,
      entityNum: doc.num,
      userId: user.id,
      details: newStatus !== existing.status ? { from: existing.status, to: newStatus } : undefined,
    });

    return NextResponse.json(doc);
  } catch (error: unknown) {
    console.error("PUT /api/documents error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "documents.delete")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (!await canAccessDocument(user, id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const existing = await prisma.document.findUnique({ where: { id }, select: { status: true, num: true } });
    if (!existing) return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });

    if (!canDeleteDocument(existing.status)) {
      return NextResponse.json({ error: "Ce document ne peut plus être supprimé" }, { status: 403 });
    }

    const doc = await deleteDocument(id);

    await createAuditEvent({
      action: "DOCUMENT_DELETED",
      entityType: "document",
      entityId: doc.id,
      entityNum: doc.num,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("DELETE /api/documents error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
