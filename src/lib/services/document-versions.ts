import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function createDocumentVersion(
  documentId: string,
  changedBy?: string,
  changeSummary?: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!doc) throw new Error("Document not found");

  const lastVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  return prisma.documentVersion.create({
    data: {
      documentId,
      version: nextVersion,
      snapshot: doc as unknown as Prisma.InputJsonValue,
      changedBy: changedBy || null,
      changeSummary: changeSummary || null,
    },
  });
}

export async function getDocumentVersions(documentId: string) {
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      changeSummary: true,
      createdAt: true,
    },
  });
}

export async function getDocumentVersion(documentId: string, version: number) {
  return prisma.documentVersion.findUnique({
    where: { documentId_version: { documentId, version } },
  });
}
