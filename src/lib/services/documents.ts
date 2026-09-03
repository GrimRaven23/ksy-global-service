import { prisma } from "@/lib/prisma";
import { snapshotCompany } from "./company";
import type { PrismaClient } from "@prisma/client";

function nextNum(seqType: string, year: number): string {
  const prefix = seqType === "PROFORMA" ? "PF" : "FAC";
  return `${prefix}-${year}-`;
}

async function getNextNumber(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, type: "PROFORMA" | "DEFINITIVE"): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = nextNum(type, year);
  const seq = await tx.documentSequence.upsert({
    where: { type_year: { type, year } },
    update: { nextNumber: { increment: 1 } },
    create: { type, year, nextNumber: 1 },
  });
  const num = String(seq.nextNumber).padStart(3, "0");
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

  return prisma.$transaction(async (tx) => {
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

    return doc;
  });
}

export async function updateDocument(id: string, data: Record<string, unknown>) {
  const company = await prisma.companySettings.findUnique({ where: { id: "company_main" } });
  if (!company) throw new Error("Company settings not found");

  const companySnap = snapshotCompany(company);
  const customerSnap: Record<string, string | null> = {};
  if (data.customerName !== undefined) customerSnap.customerName = data.customerName as string;
  if (data.customerAddr !== undefined) customerSnap.customerAddr = data.customerAddr as string;
  if (data.customerPhone !== undefined) customerSnap.customerPhone = data.customerPhone as string;
  if (data.customerEmail !== undefined) customerSnap.customerEmail = data.customerEmail as string;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new Error("Document not found");

    const updateData: Record<string, unknown> = { ...companySnap, ...customerSnap };
    if (data.date !== undefined) updateData.date = new Date(data.date as string);
    if (data.validity !== undefined) updateData.validity = data.validity ? new Date(data.validity as string) : null;
    if (data.ref !== undefined) updateData.ref = data.ref as string;
    if (data.saleMode !== undefined) updateData.saleMode = data.saleMode;
    if (data.status !== undefined) updateData.status = data.status;
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

    return tx.document.update({
      where: { id },
      data: updateData,
      include: { items: true, customer: true },
    });
  });
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, customer: true },
  });
}

export async function listDocuments(type?: string) {
  const where = type ? { type: type as "PROFORMA" | "DEFINITIVE" } : {};
  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true, customer: true },
    take: 100,
  });
}

export async function deleteDocument(id: string) {
  return prisma.document.delete({ where: { id } });
}
