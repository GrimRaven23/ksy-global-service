import { prisma } from "@/lib/prisma";
import { snapshotCompany } from "./company";
import { createDocumentVersionTx } from "./document-versions";
import type { PrismaClient } from "@prisma/client";

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "P2002";
}

function nextNum(seqType: string, year: number): string {
  const prefix = seqType === "PROFORMA" ? "PF" : "FAC";
  return `${prefix}-${year}-`;
}

async function getNextNumber(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, type: "PROFORMA" | "DEFINITIVE"): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = nextNum(type, year);
  const existing = await tx.documentSequence.findUnique({
    where: { type_year: { type, year } },
  });

  let nextNumber: number;
  if (existing) {
    const updated = await tx.documentSequence.update({
      where: { id: existing.id },
      data: { nextNumber: { increment: 1 } },
    });
    nextNumber = updated.nextNumber;
  } else {
    const created = await tx.documentSequence.create({
      data: { type, year, nextNumber: 1 },
    });
    nextNumber = created.nextNumber;
  }

  const num = String(nextNumber).padStart(3, "0");
  return `${prefix}${num}`;
}

export async function createDocument(data: {
  type: "PROFORMA" | "DEFINITIVE";
  date?: string;
  validity?: string | null;
  ref?: string;
  saleMode?: "DIRECTE" | "LIVRAISON";
  tvaOn?: boolean;
  tvaRate?: number;
  customerId?: string | null;
  customerName?: string;
  customerAddr?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: { designation: string; quantity: number; unitPrice: number }[];
  userId?: string;
}) {
  const company = await prisma.companySettings.findUnique({ where: { id: "company_main" } });
  if (!company) throw new Error("Company settings not found");

  const companySnap = snapshotCompany(company);
  const customerSnap = {
    customerName: data.customerName || null,
    customerAddr: data.customerAddr || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
  };

  const computedItems = data.items.map((item) => ({
    designation: item.designation,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: Math.round(item.quantity * item.unitPrice * 100) / 100,
    sortOrder: 0,
  }));

  const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
  const tvaOn = data.tvaOn ?? company.tvaDefault === "oui";
  const tvaRate = data.tvaRate ?? Number(company.tvaRate);
  const tvaAmount = tvaOn ? Math.round(subtotal * tvaRate) / 100 : 0;
  const total = subtotal + tvaAmount;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const num = await getNextNumber(tx, data.type);

        const doc = await tx.document.create({
          data: {
            type: data.type,
            num,
            date: data.date ? new Date(data.date) : new Date(),
            validity: data.validity ? new Date(data.validity) : null,
            ref: data.ref || null,
            saleMode: data.saleMode || "DIRECTE",
            status: "DRAFT",
            tvaOn,
            tvaRate,
            subtotal,
            tvaAmount,
            total,
            customerId: data.customerId || null,
            ...companySnap,
            ...customerSnap,
            createdBy: data.userId || null,
            items: {
              create: computedItems.map((item) => ({
                designation: item.designation,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                sortOrder: item.sortOrder,
              })),
            },
          },
          include: { items: true, customer: true },
        });

        await createDocumentVersionTx(tx, doc.id, data.userId, "Création du document");

        return doc;
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

export async function updateDocument(
  id: string,
  data: Record<string, unknown>,
  opts?: { changedBy?: string; changeSummary?: string }
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new Error("Document not found");

    const isStatusOnly =
      data.status !== undefined &&
      data.date === undefined &&
      data.validity === undefined &&
      data.ref === undefined &&
      data.saleMode === undefined &&
      data.tvaOn === undefined &&
      data.tvaRate === undefined &&
      data.customerId === undefined &&
      data.customerName === undefined &&
      data.customerAddr === undefined &&
      data.customerPhone === undefined &&
      data.customerEmail === undefined &&
      data.items === undefined;

    const updateData: Record<string, unknown> = {};
    if (!isStatusOnly) {
      const company = await tx.companySettings.findUnique({ where: { id: "company_main" } });
      if (!company) throw new Error("Company settings not found");
      if (existing.status === "DRAFT") {
        Object.assign(updateData, snapshotCompany(company));
      }
      if (data.customerName !== undefined) updateData.customerName = data.customerName as string;
      if (data.customerAddr !== undefined) updateData.customerAddr = data.customerAddr as string;
      if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone as string;
      if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail as string;
    }
    if (existing.status !== "DRAFT") {
      if (!isStatusOnly) throw new Error("Ce document ne peut plus être modifié");
      const st = (data.status === "FINALIZED" ? "EMISE" : data.status) as "DRAFT" | "EMISE" | "CANCELLED" | "CONVERTED";
      const statusData: Record<string, unknown> = { status: st };
      if (st === "EMISE" && !existing.finalizedAt) {
        statusData.finalizedAt = new Date();
        statusData.finalizedBy = opts?.changedBy ?? null;
      }
      const updated = await tx.document.update({
        where: { id },
        data: statusData,
        include: { items: true, customer: true },
      });
      await createDocumentVersionTx(tx, id, opts?.changedBy, opts?.changeSummary ?? `Statut → ${st}`);
      return updated;
    }
    if (data.date !== undefined) updateData.date = new Date(data.date as string);
    if (data.validity !== undefined) updateData.validity = data.validity ? new Date(data.validity as string) : null;
    if (data.ref !== undefined) updateData.ref = data.ref as string;
    if (data.saleMode !== undefined) updateData.saleMode = data.saleMode;
    if (data.status !== undefined) updateData.status = data.status === "FINALIZED" ? "EMISE" : data.status;
    if (updateData.status === "EMISE" && !existing.finalizedAt) {
      updateData.finalizedAt = new Date();
      updateData.finalizedBy = opts?.changedBy ?? null;
    }
    if (data.tvaOn !== undefined) updateData.tvaOn = data.tvaOn;
    if (data.tvaRate !== undefined) updateData.tvaRate = data.tvaRate;
    if (data.customerId !== undefined) updateData.customerId = data.customerId as string | null;

    if (data.items && Array.isArray(data.items)) {
      await tx.documentItem.deleteMany({ where: { documentId: id } });
      const items = data.items as { designation: string; quantity: number; unitPrice: number }[];
      updateData.items = {
        create: items.map((item, i) => ({
          designation: item.designation,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Math.round(item.quantity * item.unitPrice * 100) / 100,
          sortOrder: i,
        })),
      };
    }

    // Recalculate totals
    const items = data.items && Array.isArray(data.items)
      ? (data.items as { designation: string; quantity: number; unitPrice: number }[])
      : existing.items;
    const subtotal = items.reduce((s: number, i: { quantity: number | string | unknown; unitPrice: number | string | unknown }) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
    const tvaOn = (data.tvaOn !== undefined ? data.tvaOn : existing.tvaOn) as boolean;
    const tvaRate = (data.tvaRate !== undefined ? data.tvaRate : Number(existing.tvaRate)) as number;
    const tvaAmount = tvaOn ? Math.round(subtotal * tvaRate) / 100 : 0;
    updateData.subtotal = subtotal;
    updateData.tvaAmount = tvaAmount;
    updateData.total = subtotal + tvaAmount;

    const updated = await tx.document.update({
      where: { id },
      data: updateData,
      include: { items: true, customer: true },
    });
    await createDocumentVersionTx(tx, id, opts?.changedBy, opts?.changeSummary ?? (isStatusOnly ? `Statut → ${updateData.status as string}` : "Modification du brouillon"));
    return updated;
  });
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      deliveryNotes: { select: { id: true, num: true, status: true } },
      convertedFrom: { select: { id: true, num: true, type: true } },
      conversions: { select: { id: true, num: true, type: true } },
    },
  });
}

export async function listDocuments(type?: string, page = 1, pageSize = 20) {
  const where = type ? { type: type as "PROFORMA" | "DEFINITIVE" } : {};
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: true,
        deliveryNotes: { select: { id: true, num: true } },
        convertedFrom: { select: { id: true, num: true, type: true } },
        conversions: { select: { id: true, num: true, type: true } },
      },
      skip,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function deleteDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, deliveryNotes: { select: { id: true } } },
  });
  if (!doc) throw new Error("Document not found");
  if (doc.deliveryNotes.length > 0) {
    throw new Error("Cannot delete document with linked delivery notes. Delete the delivery notes first.");
  }
  return prisma.document.delete({ where: { id } });
}

export async function duplicateDocument(
  sourceId: string,
  options?: { type?: "PROFORMA" | "DEFINITIVE"; userId?: string }
) {
  const source = await prisma.document.findUnique({
    where: { id: sourceId },
    include: { items: true },
  });
  if (!source) throw new Error("Document source introuvable");

  return createDocument({
    type: options?.type || source.type,
    ref: source.ref || undefined,
    saleMode: source.saleMode,
    tvaOn: source.tvaOn,
    tvaRate: Number(source.tvaRate),
    customerId: source.customerId || undefined,
    customerName: source.customerName || undefined,
    customerAddr: source.customerAddr || undefined,
    customerPhone: source.customerPhone || undefined,
    customerEmail: source.customerEmail || undefined,
    items: source.items.map((item) => ({
      designation: item.designation,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
    userId: options?.userId,
  });
}

export async function convertProformaToDefinitive(
  proformaId: string,
  options?: { saleMode?: "DIRECTE" | "LIVRAISON"; userId?: string }
) {
  const source = await prisma.document.findUnique({
    where: { id: proformaId },
    include: { items: true, conversions: { select: { id: true } } },
  });
  if (!source) throw new Error("Document source introuvable");
  if (source.type !== "PROFORMA") throw new Error("Seules les factures pro forma peuvent être converties");
  if (source.conversions.length > 0) {
    throw new Error("Cette facture pro forma a déjà été convertie en facture définitive");
  }

  const company = await prisma.companySettings.findUnique({ where: { id: "company_main" } });
  if (!company) throw new Error("Company settings not found");

  const companySnap = snapshotCompany(company);
  const customerSnap = {
    customerName: source.customerName,
    customerAddr: source.customerAddr,
    customerPhone: source.customerPhone,
    customerEmail: source.customerEmail,
  };

  const computedItems = source.items.map((item) => ({
    designation: item.designation,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    total: Math.round(Number(item.quantity) * Number(item.unitPrice) * 100) / 100,
    sortOrder: item.sortOrder,
  }));

  const subtotal = computedItems.reduce((s, i) => s + i.total, 0);
  const tvaOn = source.tvaOn;
  const tvaRate = Number(source.tvaRate);
  const tvaAmount = tvaOn ? Math.round(subtotal * tvaRate) / 100 : 0;
  const total = subtotal + tvaAmount;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const alreadyConverted = await tx.document.findFirst({
          where: { convertedFromId: source.id },
          select: { id: true },
        });
        if (alreadyConverted) {
          throw new Error("Cette facture pro forma a déjà été convertie en facture définitive");
        }

        const num = await getNextNumber(tx, "DEFINITIVE");

        const definitive = await tx.document.create({
          data: {
            type: "DEFINITIVE",
            num,
            date: new Date(),
            validity: null,
            ref: source.ref,
            saleMode: options?.saleMode || source.saleMode,
            status: "DRAFT",
            tvaOn,
            tvaRate,
            subtotal,
            tvaAmount,
            total,
            customerId: source.customerId,
            ...companySnap,
            ...customerSnap,
            createdBy: options?.userId || null,
            convertedFromId: source.id,
            items: {
              create: computedItems.map((item) => ({
                designation: item.designation,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                sortOrder: item.sortOrder,
              })),
            },
          },
          include: { items: true, customer: true },
        });

        await tx.document.update({
          where: { id: source.id },
          data: { status: "CONVERTED" },
        });

        await createDocumentVersionTx(tx, source.id, options?.userId, `Convertie en ${num}`);
        await createDocumentVersionTx(tx, definitive.id, options?.userId, `Créée par conversion de ${source.num}`);

        return definitive;
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
