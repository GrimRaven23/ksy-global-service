import { NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!hasPermission(user.role, "documents.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalDocuments, totalRevenue, documentsThisMonth, totalDeliveryNotes, recentDocs, recentDeliveries, recentActivity] = await Promise.all([
      prisma.document.count(),
      prisma.document.aggregate({ _sum: { total: true }, where: { status: { in: ["EMISE", "FINALIZED"] } } }),
      prisma.document.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.deliveryNote.count(),
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
        take: 5,
        select: { id: true, action: true, entityType: true, createdAt: true, user: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalDocuments,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        documentsThisMonth,
        totalDeliveryNotes,
      },
      recentDocs,
      recentDeliveries,
      recentActivity,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
