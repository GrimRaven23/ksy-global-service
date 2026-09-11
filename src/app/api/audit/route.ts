import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTION_OPTIONS = [
  "LOGIN_SUCCESS", "LOGIN_FAILURE",
  "USER_CREATED", "USER_DISABLED", "USER_UPDATED", "ROLE_CHANGED",
  "DOCUMENT_CREATED", "DOCUMENT_UPDATED", "DOCUMENT_FINALIZED", "DOCUMENT_DELETED",
  "DELIVERY_NOTE_CREATED", "DELIVERY_NOTE_UPDATED", "DELIVERY_NOTE_DELETED",
  "COMPANY_SETTINGS_UPDATED",
];

function toCSV(events: { createdAt: Date; action: string; entityType: string; entityNum: string | null; user?: { name: string; email: string } | null; details: unknown }[]): string {
  const header = "Date,Action,Type Entité,Num Entité,Utilisateur,Email,Details\n";
  const rows = events.map((e) => {
    const date = e.createdAt.toISOString();
    const action = e.action;
    const entityType = e.entityType || "";
    const entityNum = e.entityNum || "";
    const userName = e.user?.name || "";
    const userEmail = e.user?.email || "";
    const details = JSON.stringify(e.details || {}).replace(/"/g, '""');
    return `"${date}","${action}","${entityType}","${entityNum}","${userName}","${userEmail}","${details}"`;
  });
  return header + rows.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "audit.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const entityType = searchParams.get("entityType") || undefined;
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const format = searchParams.get("format") || "json";

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (action && ACTION_OPTIONS.includes(action)) where.action = action;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    const isCSV = format === "csv";
    const queryLimit = isCSV ? 5000 : limit;

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: queryLimit,
        skip: isCSV ? 0 : offset,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditEvent.count({ where }),
    ]);

    if (isCSV) {
      const csv = toCSV(events);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    return apiServerError(error, "GET /api/audit");
  }
}
