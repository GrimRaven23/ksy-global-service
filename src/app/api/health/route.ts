import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number }> = {};
  const startTime = Date.now();

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error" };
  }

  // Company settings check
  try {
    const settingsStart = Date.now();
    const settings = await prisma.companySettings.findUnique({ where: { id: "company_main" }, select: { name: true } });
    checks.companySettings = { status: settings ? "ok" : "missing", latencyMs: Date.now() - settingsStart };
  } catch {
    checks.companySettings = { status: "error" };
  }

  // User count check
  try {
    const userStart = Date.now();
    const userCount = await prisma.user.count({ where: { status: "ACTIVE" } });
    checks.users = { status: "ok", latencyMs: Date.now() - userStart };
    (checks.users as Record<string, unknown>).activeCount = userCount;
  } catch {
    checks.users = { status: "error" };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      latencyMs: totalLatency,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
    },
    { status: allHealthy ? 200 : 503 }
  );
}
