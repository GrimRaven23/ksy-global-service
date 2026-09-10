import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, getSessionUser } from "@/lib/auth/session";
import { createAuditEvent } from "@/lib/services/audit";
import { getCsrfCookieName } from "@/lib/csrf-server";

export async function POST() {
  const user = await getSessionUser().catch(() => null);
  await destroySession();
  const cookieStore = await cookies();
  cookieStore.delete(getCsrfCookieName());
  if (user) {
    await createAuditEvent({
      action: "LOGOUT",
      entityType: "user",
      entityId: user.id,
      userId: user.id,
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
