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

    const [
      totalDocuments,
      totalRevenue,
      documentsThisMonth,
      revenueThisMonth,
      draftDocuments,
      pendingBLs,
      totalDeliveryNotes,
      totalCustomers,
      recentDocs,
      recentDeliveries,
      recentActivity,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.document.aggregate({ _sum: { total: true }, where: { status: { in: ["EMISE", "FINALIZED"] } } }),
      prisma.document.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.document.aggregate({ _sum: { total: true }, where: { status: { in: ["EMISE", "FINALIZED"] }, createdAt: { gte: startOfMonth } } }),
      prisma.document.count({ where: { status: "DRAFT" } }),
      prisma.deliveryNote.count({ where: { status: "DRAFT" } }),
      prisma.deliveryNote.count(),
      prisma.customer.count(),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, num: true, type: true, date: true, total: true, status: true, createdAt: true, customerName: true },
      }),
      prisma.deliveryNote.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, num: true, date: true, status: true, createdAt: true, customerName: true },
      }),
      prisma.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, action: true, entityType: true, entityNum: true, createdAt: true, user: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalDocuments,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        documentsThisMonth,
        revenueThisMonth: Number(revenueThisMonth._sum.total || 0),
        totalDeliveryNotes,
        totalCustomers,
        draftDocuments,
        pendingBLs,
      },
      recentDocs,
      recentDeliveries,
      recentActivity,
    });
  } catch (error) {
    return apiServerError(error, "GET /api/dashboard");
  }
}
