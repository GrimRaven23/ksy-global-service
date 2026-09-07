import crypto from "crypto";

const CSRF_SECRET = process.env.SESSION_SECRET || "fallback-csrf-secret";
const CSRF_MAX_AGE = 60 * 60; // 1 hour

export function generateCsrfToken(): string {
  const payload = JSON.stringify({
    iat: Date.now(),
    exp: Date.now() + CSRF_MAX_AGE * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const signature = crypto.createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + signature;
}

export function verifyCsrfToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expected = crypto.createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const data = JSON.parse(payload);
    if (data.exp && Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function validateCsrf(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) return false;
    } catch {
      return false;
    }
  }

  return true;
}
