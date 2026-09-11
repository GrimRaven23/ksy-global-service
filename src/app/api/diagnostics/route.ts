import { NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { apiServerError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "users.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const checks: Record<string, unknown> = {};

    checks.app = {
      version: process.env.npm_package_version || "1.0.0",
      nodeVersion: process.version,
      nextVersion: process.env.__NEXT_VERSION || "unknown",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
    };

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch {
      checks.database = { status: "unreachable" };
    }

    try {
      const lastMigration = await prisma.$queryRaw<{ name: string }[]>`
        SELECT name FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC LIMIT 1
      `;
      checks.lastMigration = lastMigration[0]?.name || "unknown";
    } catch {
      checks.lastMigration = "unknown";
    }

    try {
      const activeSessions = await prisma.user.count({ where: { status: "ACTIVE" } });
      checks.activeUsers = activeSessions;
    } catch {
      checks.activeUsers = "unknown";
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      ...checks,
    });
  } catch (error) {
    return apiServerError(error, "GET /api/diagnostics");
  }
}
