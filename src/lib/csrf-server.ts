import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";

export function getCsrfCookieName(): string {
  return CSRF_COOKIE;
}

export async function setCsrfCookie(): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return token;
}
