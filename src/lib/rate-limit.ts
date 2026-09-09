import { prisma } from "@/lib/prisma";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || now > existing.resetAt) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfter = (existing.resetAt.getTime() - now.getTime()) / 1000;
    return { allowed: false, remaining: 0, retryAfter };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: maxRequests - existing.count - 1, retryAfter: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function rateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({ ok: false, error: "Trop de requêtes. Réessayez plus tard." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(retryAfter).toString(),
        "X-RateLimit-Limited": "true",
      },
    }
  );
}
