import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { createAuditEvent } from "@/lib/services/audit";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) {
    pass += chars[arr[i] % chars.length];
  }
  return pass;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true, name: true } });
    if (!target) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (target.role === "OWNER" && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut réinitialiser le mot de passe d'un autre propriétaire" },
        { status: 403 }
      );
    }

    const tempPassword = generateTempPassword();
    const newHash = hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: newHash, mustChangePassword: true },
    });

    await createAuditEvent({
      action: "PASSWORD_CHANGED",
      entityType: "user",
      entityId: id,
      userId: user.id,
      details: { type: "admin_reset", targetEmail: target.email },
    });

    return NextResponse.json({
      ok: true,
      tempPassword,
      message: `Mot de passe réinitialisé pour ${target.name}`,
    });
  } catch (error) {
    return apiServerError(error, "POST /api/users/[id]/reset-password");
  }
}
