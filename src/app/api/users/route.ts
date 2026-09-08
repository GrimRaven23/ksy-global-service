import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission, canManageRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { userCreateSchema, userUpdateSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/services/audit";

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "users.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "users.create")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const targetRole = parsed.data.role || "SALES";
    if (!canManageRole(user.role, targetRole)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas créer un compte avec ce niveau d'accès" },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash: hashPassword(parsed.data.password),
        role: targetRole,
      },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });

    await createAuditEvent({
      action: "USER_CREATED",
      entityType: "user",
      entityId: newUser.id,
      userId: user.id,
      details: { email: newUser.email, role: newUser.role },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "users.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (id === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre compte" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.role) {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (!targetUser) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }
      if (!canManageRole(user.role, parsed.data.role)) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas attribuer ce niveau d'accès" },
          { status: 403 }
        );
      }
      if (targetUser.role === "OWNER" && user.role !== "OWNER") {
        return NextResponse.json(
          { error: "Seul le propriétaire peut modifier un autre propriétaire" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });

    const action = parsed.data.status === "DISABLED" ? "USER_DISABLED" : parsed.data.role ? "ROLE_CHANGED" : "USER_DISABLED";
    await createAuditEvent({
      action,
      entityType: "user",
      entityId: updated.id,
      userId: user.id,
      details: { changes: parsed.data },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT /api/users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
