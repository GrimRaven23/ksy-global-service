import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission, canManageRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/services/audit";
import type { AuditAction } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const recentAudit = await prisma.auditEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, entityType: true, details: true, createdAt: true },
    });

    return NextResponse.json({ ...target, recentAudit });
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const { id } = await params;
    const isSelf = id === user.id;

    if (!isSelf && !hasPermission(user.role, "users.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, status } = body as {
      name?: string; email?: string; role?: string; status?: string;
    };

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
    if (!target) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (!isSelf) {
      if (role && role !== target.role) {
        if (!canManageRole(user.role, role)) {
          return NextResponse.json(
            { error: "Vous ne pouvez pas attribuer ce niveau d'accès" },
            { status: 403 }
          );
        }
        if (target.role === "OWNER" && user.role !== "OWNER") {
          return NextResponse.json(
            { error: "Seul le propriétaire peut modifier un autre propriétaire" },
            { status: 403 }
          );
        }
      }
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }

    if (!isSelf && status === "DISABLED" && target.role === "OWNER") {
      const activeOwners = await prisma.user.count({ where: { role: "OWNER", status: "ACTIVE" } });
      if (activeOwners <= 1) {
        return NextResponse.json({ error: "Impossible de désactiver le dernier propriétaire actif" }, { status: 400 });
      }
    }

    if (email && email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, name: true, role: true, status: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
      },
    });

    let action: AuditAction = "USER_UPDATED";
    if (status === "DISABLED") action = "USER_DISABLED";
    else if (status === "ACTIVE") action = "USER_ENABLED";
    else if (role) action = "ROLE_CHANGED";

    await createAuditEvent({
      action,
      entityType: "user",
      entityId: id,
      userId: user.id,
      details: { changes: updateData },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Seul le propriétaire peut supprimer un compte" }, { status: 403 });
    }

    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
    if (!target) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (target.role === "OWNER") {
      const activeOwners = await prisma.user.count({ where: { role: "OWNER", status: "ACTIVE" } });
      if (activeOwners <= 1) {
        return NextResponse.json({ error: "Impossible de supprimer le dernier propriétaire actif" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });

    await createAuditEvent({
      action: "USER_DELETED",
      entityType: "user",
      entityId: id,
      userId: user.id,
      details: { email: target.email, role: target.role },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
