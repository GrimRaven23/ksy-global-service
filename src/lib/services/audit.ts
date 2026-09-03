import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function createAuditEvent(data: {
  action: string;
  entityType: string;
  entityId?: string;
  entityNum?: string;
  details?: Record<string, unknown>;
}) {
  return prisma.auditEvent.create({
    data: {
      action: data.action as any,
      entityType: data.entityType,
      entityId: data.entityId,
      entityNum: data.entityNum,
      details: (data.details as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

export async function listAuditEvents(limit = 50) {
  return prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
