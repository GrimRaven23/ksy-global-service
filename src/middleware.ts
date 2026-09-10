import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit-edge";
import { validateCsrf } from "@/lib/csrf";

const SESSION_SECRET = process.env.SESSION_SECRET || "";

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/logout", "/login"];
const PUBLIC_STATIC = ["/_next", "/favicon.ico", "/images", "/api/health"];

const STATIC_EXTENSIONS = [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".map", ".json"];

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToHex(new Uint8Array(signature));
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function verifySessionToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const rawPayload = base64UrlDecode(payloadB64);
    const expected = await hmacSign(rawPayload, secret);
    const sigBytes = hexToBytes(signature);
    const expBytes = hexToBytes(expected);
    if (sigBytes.length !== expBytes.length) return null;
    let diff = 0;
    for (let i = 0; i < sigBytes.length; i++) diff |= sigBytes[i] ^ expBytes[i];
    if (diff !== 0) return null;
    const payload = JSON.parse(rawPayload);
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ];
  if (process.env.NODE_ENV === "production") {
    cspDirectives.push("upgrade-insecure-requests");
  }
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();

  if (PUBLIC_STATIC.some((p) => pathname.startsWith(p)) || STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    const resp = NextResponse.next();
    addSecurityHeaders(resp, nonce);
    resp.headers.set("X-Nonce", nonce);
    return resp;
  }

  if (!SESSION_SECRET) {
    console.error("FATAL: SESSION_SECRET not configured");
    return new NextResponse("Server configuration error", { status: 503 });
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkRateLimit(`login:${ip}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      console.warn(`Rate limit exceeded for login from IP: ${ip}`);
      const resp = NextResponse.json({ ok: false, error: "Trop de requêtes. Réessayez plus tard." }, { status: 429 });
      resp.headers.set("Retry-After", Math.ceil(retryAfter).toString());
      addSecurityHeaders(resp, nonce);
      return resp;
    }
  }

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && !pathname.startsWith("/api/health")) {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkRateLimit(`api:${ip}`, 100, 60 * 1000);
    if (!allowed) {
      const resp = NextResponse.json({ ok: false, error: "Trop de requêtes. Réessayez plus tard." }, { status: 429 });
      resp.headers.set("Retry-After", Math.ceil(retryAfter).toString());
      addSecurityHeaders(resp, nonce);
      return resp;
    }
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("X-Nonce", nonce);
    const resp = NextResponse.next({ request: { headers: modifiedHeaders } });
    addSecurityHeaders(resp, nonce);
    return resp;
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      const resp = NextResponse.json({ ok: false, error: "Non authentifié" }, { status: 401 });
      addSecurityHeaders(resp, nonce);
      return resp;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return addSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  const payload = await verifySessionToken(token, SESSION_SECRET);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const resp = NextResponse.json({ ok: false, error: "Session expirée" }, { status: 401 });
      resp.cookies.delete("session");
      resp.cookies.delete("csrf_token");
      addSecurityHeaders(resp, nonce);
      return resp;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const resp = NextResponse.redirect(url);
    resp.cookies.delete("session");
    resp.cookies.delete("csrf_token");
    addSecurityHeaders(resp, nonce);
    return resp;
  }

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    if (!validateCsrf(request, request.cookies)) {
      const resp = NextResponse.json({ ok: false, error: "Token CSRF invalide — rechargez la page" }, { status: 403 });
      addSecurityHeaders(resp, nonce);
      return resp;
    }
  }

  if (payload.mustChangePassword) {
    const allowed = ["/change-password", "/api/auth/change-password", "/api/auth/logout"];
    if (!allowed.some((p) => pathname.startsWith(p))) {
      if (pathname.startsWith("/api/")) {
        const resp = NextResponse.json({ ok: false, error: "Changement de mot de passe requis" }, { status: 403 });
        addSecurityHeaders(resp, nonce);
        return resp;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      return addSecurityHeaders(NextResponse.redirect(url), nonce);
    }
  }

  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set("X-Nonce", nonce);
  const resp = NextResponse.next({ request: { headers: modifiedHeaders } });
  addSecurityHeaders(resp, nonce);
  return resp;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
