import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logging";

export function logRequest(request: NextRequest, response: NextResponse, startTime: number) {
  const duration = Date.now() - startTime;
  const { method } = request;
  const { pathname } = request.nextUrl;
  const status = response.status;
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";

  const logData = {
    method,
    path: pathname,
    status,
    duration,
    ip,
    userAgent: userAgent.substring(0, 100),
  };

  if (status >= 500) {
    logger.error(`${method} ${pathname} ${status} ${duration}ms`, "http", logData);
  } else if (status >= 400) {
    logger.warn(`${method} ${pathname} ${status} ${duration}ms`, "http", logData);
  } else if (pathname !== "/api/health") {
    logger.info(`${method} ${pathname} ${status} ${duration}ms`, "http", logData);
  }
}
