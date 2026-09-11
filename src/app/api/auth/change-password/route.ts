import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSession, destroySession } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { changePasswordSchema } from "@/lib/validation";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Mot de passe actuel et nouveau mot de passe requis (min. 8 caractères)" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit être différent de l'actuel" }, { status: 400 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const valid = verifyPassword(currentPassword, fullUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
    }

    const newHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    await destroySession();
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: false,
    });

    await createAuditEvent({
      action: "PASSWORD_CHANGED",
      entityType: "user",
      entityId: user.id,
      userId: user.id,
    });

    return NextResponse.json({ ok: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    return apiServerError(error, "POST /api/auth/change-password");
  }
}
