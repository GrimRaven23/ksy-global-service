import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { setCsrfCookie } from "@/lib/csrf-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  await setCsrfCookie();
  return NextResponse.json({ user });
}
