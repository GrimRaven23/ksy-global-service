import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { createAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

const auditLogSchema = z.object({
  action: z.enum([
    "DOCUMENT_PRINTED",
    "DOCUMENT_FINALIZED",
    "DOCUMENT_CANCELLED",
    "DELIVERY_NOTE_PRINTED",
    "DELIVERY_NOTE_CONFIRMED",
  ]),
  entityType: z.string().max(50),
  entityId: z.string().max(100).optional(),
  entityNum: z.string().max(50).optional(),
  details: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const parsed = auditLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    if (!hasPermission(user.role, "documents.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await createAuditEvent({
      action: parsed.data.action,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      entityNum: parsed.data.entityNum,
      userId: user.id,
      details: parsed.data.details,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/audit/log error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
