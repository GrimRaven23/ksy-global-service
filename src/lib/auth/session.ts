import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";
import { ROLE_PERMISSIONS } from "@/lib/types";

const SESSION_SECRET = process.env.SESSION_SECRET || "";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function createSessionToken(payload: string, secret: string): string {
  const signature = sign(payload, secret);
  return Buffer.from(payload).toString("base64url") + "." + signature;
}

function verifySessionToken(token: string, secret: string): Record<string, unknown> | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const expected = sign(payloadB64, secret);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; email: string; name: string; role: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  });
  const token = createSessionToken(payload, SESSION_SECRET);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!SESSION_SECRET) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = verifySessionToken(token, SESSION_SECRET);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub as string } });
  if (!user || user.status !== "ACTIVE") return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function hasPermission(userRole: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[userRole] || [];
  return perms.includes(permission as any);
}
