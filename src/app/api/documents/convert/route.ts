import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { convertDocumentSchema } from "@/lib/validation";
import { convertProformaToDefinitive } from "@/lib/services/documents";
import { createAuditEvent } from "@/lib/services/audit";
import { canAccessDocument } from "@/lib/authorization";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "proforma.convert")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = convertDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    if (!await canAccessDocument(user, parsed.data.documentId)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const definitive = await convertProformaToDefinitive(parsed.data.documentId, {
      saleMode: parsed.data.saleMode,
      userId: user.id,
    });

    await createAuditEvent({
      action: "DOCUMENT_CONVERTED",
      entityType: "document",
      entityId: definitive.id,
      entityNum: definitive.num,
      userId: user.id,
      details: {
        sourceDocumentId: parsed.data.documentId,
        sourceType: "PROFORMA",
        targetType: "DEFINITIVE",
        saleMode: definitive.saleMode,
      },
    });

    return NextResponse.json(definitive, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (/déjà été convertie|pro forma|introuvable/i.test(message)) {
      return NextResponse.json({ error: message || "Erreur lors de la conversion du document" }, { status: 400 });
    }
    return apiServerError(error, "POST /api/documents/convert");
  }
}
