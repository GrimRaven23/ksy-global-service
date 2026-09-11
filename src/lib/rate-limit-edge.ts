const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of RATE_LIMIT_STORE) {
    if (now > entry.resetAt) RATE_LIMIT_STORE.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter: number; limit: number; resetAt: number } {
  cleanup();
  const now = Date.now();
  const resetAt = now + windowMs;
  const existing = RATE_LIMIT_STORE.get(key);

  if (!existing || now > existing.resetAt) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0, limit: maxRequests, resetAt };
  }

  if (existing.count >= maxRequests) {
    const retryAfter = (existing.resetAt - now) / 1000;
    return { allowed: false, remaining: 0, retryAfter, limit: maxRequests, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: maxRequests - existing.count, retryAfter: 0, limit: maxRequests, resetAt: existing.resetAt };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}
