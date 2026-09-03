import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

export async function createAuditEvent(data: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityNum?: string;
  userId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  return prisma.auditEvent.create({
    data: {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityNum: data.entityNum,
      userId: data.userId,
      details: (data.details as Prisma.InputJsonValue) ?? undefined,
      ipAddress: data.ipAddress,
    },
  });
}

export async function listAuditEvents(limit = 50, offset = 0) {
  return prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
    skip: offset,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function countAuditEvents() {
  return prisma.auditEvent.count();
}
