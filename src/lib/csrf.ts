import crypto from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const CSRF_MAX_AGE = 60 * 60; // 1 hour

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getCsrfCookieName(): string {
  return CSRF_COOKIE;
}

export function getCsrfHeaderName(): string {
  return CSRF_HEADER;
}

export function getCsrfMaxAge(): number {
  return CSRF_MAX_AGE;
}

export function validateCsrf(request: Request, cookies: { get: (name: string) => { value: string } | undefined }): boolean {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const cookieToken = cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }

  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      headers.set(CSRF_HEADER, token);
    }
  }

  return fetch(url, { ...options, headers });
}
