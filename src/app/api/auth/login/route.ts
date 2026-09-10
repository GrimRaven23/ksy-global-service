import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation";
import { createAuditEvent } from "@/lib/services/audit";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logging";
import { setCsrfCookie } from "@/lib/csrf-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError({ statusCode: 400, message: "Email et mot de passe requis" });
    }

    const { email, password } = parsed.data;

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      logger.error("Login DB query failed", "auth", { email }, dbError);
      return apiError({ statusCode: 500, message: "Erreur de connexion à la base de données" });
    }

    if (!user) {
      logger.warn("Login attempt - user not found", "auth", { email });
      createAuditEvent({
        action: "LOGIN_FAILURE",
        entityType: "auth",
        details: { email, reason: "user_not_found" },
      }).catch(() => {});
      return apiError({ statusCode: 401, message: "Identifiants incorrects" });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      logger.warn("Login attempt - invalid password", "auth", { email });
      createAuditEvent({
        action: "LOGIN_FAILURE",
        entityType: "auth",
        details: { email, reason: "invalid_password" },
      }).catch(() => {});
      return apiError({ statusCode: 401, message: "Identifiants incorrects" });
    }

    if (user.status !== "ACTIVE") {
      logger.warn("Login attempt - account disabled", "auth", { email });
      return apiError({ statusCode: 403, message: "Compte désactivé" });
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (dbError) {
      logger.error("Failed to update lastLogin", "auth", { userId: user.id }, dbError);
    }

    createAuditEvent({
      action: "LOGIN_SUCCESS",
      entityType: "auth",
      userId: user.id,
      details: { email: user.email },
    }).catch(() => {});

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    await setCsrfCookie();

    logger.info("Login successful", "auth", { userId: user.id, email: user.email, role: user.role });
    return apiSuccess({ id: user.id, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logger.error(`Login error: ${detail}`, "auth", undefined, error);
    return apiError(error);
  }
}
