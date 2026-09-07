import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.database_url = process.env.DATABASE_URL ? "configured" : "MISSING";
  checks.session_secret = process.env.SESSION_SECRET ? "configured" : "MISSING";
  checks.direct_url = process.env.DIRECT_URL ? "configured" : "MISSING";
  checks.node_env = process.env.NODE_ENV || "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.database = `error: ${msg}`;
  }

  try {
    const userCount = await prisma.user.count();
    checks.user_count = String(userCount);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.user_count = `error: ${msg}`;
  }

  const healthy = checks.database?.startsWith("ok");

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
