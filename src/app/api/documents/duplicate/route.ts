import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { duplicateDocumentSchema } from "@/lib/validation";
import { duplicateDocument } from "@/lib/services/documents";
import { createAuditEvent } from "@/lib/services/audit";
import { canAccessDocument } from "@/lib/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "documents.create")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = duplicateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    if (!await canAccessDocument(user, parsed.data.documentId)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const copy = await duplicateDocument(parsed.data.documentId, {
      type: parsed.data.type,
      userId: user.id,
    });

    await createAuditEvent({
      action: "DOCUMENT_CREATED",
      entityType: "document",
      entityId: copy.id,
      entityNum: copy.num,
      userId: user.id,
      details: {
        sourceDocumentId: parsed.data.documentId,
        duplicated: true,
      },
    });

    return NextResponse.json(copy, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (/introuvable/i.test(message)) {
      return NextResponse.json({ error: message || "Erreur lors de la duplication" }, { status: 400 });
    }
    return apiServerError(error, "POST /api/documents/duplicate");
  }
}
