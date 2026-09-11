import { NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!hasPermission(user.role, "documents.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalDocuments, totalRevenue, documentsThisMonth, totalDeliveryNotes] = await Promise.all([
      prisma.document.count(),
      prisma.document.aggregate({ _sum: { total: true }, where: { status: { in: ["EMISE", "FINALIZED"] } } }),
      prisma.document.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.deliveryNote.count(),
    ]);

    return NextResponse.json({
      totalDocuments,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      documentsThisMonth,
      totalDeliveryNotes,
    });
  } catch (error) {
    return apiServerError(error, "GET /api/dashboard/stats");
  }
}
