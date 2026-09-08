import { NextResponse } from "next/server";
import { destroySession, getSessionUser } from "@/lib/auth/session";
import { createAuditEvent } from "@/lib/services/audit";

export async function POST() {
  const user = await getSessionUser().catch(() => null);
  await destroySession();
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
