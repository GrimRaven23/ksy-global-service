import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function createDocumentVersionTx(
  tx: TxClient,
  documentId: string,
  changedBy?: string,
  changeSummary?: string
) {
  const doc = await tx.document.findUnique({
    where: { id: documentId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!doc) throw new Error("Document not found");

  const lastVersion = await tx.documentVersion.findFirst({
    where: { documentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  return tx.documentVersion.create({
    data: {
      documentId,
      version: (lastVersion?.version ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify(doc)) as Prisma.InputJsonValue,
      changedBy: changedBy || null,
      changeSummary: changeSummary || null,
    },
  });
}

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
