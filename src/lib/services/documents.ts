import { prisma } from "@/lib/prisma";
import { curYear, padN, numToWordsFCFA, calcInvoice } from "@/lib/utils";
import { snapshotCompany, getCompany } from "./company";
import { createAuditEvent } from "./audit";

export async function getNextNumber(type: "PF" | "FAC" | "BL"): Promise<string> {
  const year = curYear();
  const typeMap = { PF: "PROFORMA", FAC: "DEFINITIVE", BL: "DELIVERY" };
  const seq = await prisma.documentSequence.upsert({
    where: { type_year: { type: typeMap[type], year } },
    create: { type: typeMap[type], year, nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
  });
  return `${type}-${year}-${padN(seq.nextNumber - 1)}`;
}

export async function createDocument(data: {
  type: "PROFORMA" | "DEFINITIVE";
  num?: string;
  date?: Date;
  validity?: Date;
  ref?: string;
  saleMode?: "DIRECTE" | "LIVRAISON";
  tvaOn?: boolean;
  tvaRate?: number;
  customerId?: string;
  items?: { designation: string; quantity: number; unitPrice: number }[];
}) {
  const company = await getCompany();
  const prefix = data.type === "PROFORMA" ? "PF" : "FAC";
  const num = data.num || (await getNextNumber(prefix as any));

  const calc = calcInvoice(
    (data.items || []).map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    data.tvaOn || false,
    data.tvaRate || 18
  );

  const doc = await prisma.document.create({
    data: {
      type: data.type,
      num,
      date: data.date || new Date(),
      validity: data.validity,
      ref: data.ref,
      saleMode: (data.saleMode as any) || "DIRECTE",
      tvaOn: data.tvaOn || false,
      tvaRate: data.tvaRate || 18,
      subtotal: calc.subtotal,
      tvaAmount: calc.tva,
      total: calc.total,
      wordsValue: numToWordsFCFA(Math.round(calc.total)),
      customerId: data.customerId,
      companyId: "company_main",
      ...snapshotCompany(company),
      items: {
        create: (data.items || []).map((item, i) => ({
          designation: item.designation,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          sortOrder: i,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  await createAuditEvent({
    action: "DOCUMENT_CREATED",
    entityType: data.type,
    entityId: doc.id,
    entityNum: doc.num,
  });

  return doc;
}

export async function updateDocument(
  id: string,
  data: {
    num?: string;
    date?: Date;
    validity?: Date;
    ref?: string;
    saleMode?: string;
    status?: string;
    tvaOn?: boolean;
    tvaRate?: number;
    customerId?: string;
    items?: { id?: string; designation: string; quantity: number; unitPrice: number; sortOrder: number }[];
  }
) {
  const company = await getCompany();

  const calc = calcInvoice(
    (data.items || []).map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    data.tvaOn || false,
    data.tvaRate || 18
  );

  const updateData: any = {
    ...(data.num !== undefined && { num: data.num }),
    ...(data.date !== undefined && { date: data.date }),
    ...(data.validity !== undefined && { validity: data.validity }),
    ...(data.ref !== undefined && { ref: data.ref }),
    ...(data.saleMode !== undefined && { saleMode: data.saleMode }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.tvaOn !== undefined && { tvaOn: data.tvaOn }),
    ...(data.tvaRate !== undefined && { tvaRate: data.tvaRate }),
    ...(data.customerId !== undefined && { customerId: data.customerId }),
    subtotal: calc.subtotal,
    tvaAmount: calc.tva,
    total: calc.total,
    wordsValue: numToWordsFCFA(Math.round(calc.total)),
    ...snapshotCompany(company),
  };

  if (data.items) {
    await prisma.documentItem.deleteMany({ where: { documentId: id } });
    updateData.items = {
      create: data.items.map((item) => ({
        designation: item.designation,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        sortOrder: item.sortOrder,
      })),
    };
  }

  const doc = await prisma.document.update({
    where: { id },
    data: updateData,
    include: { items: true, customer: true },
  });

  await createAuditEvent({
    action: "DOCUMENT_UPDATED",
    entityType: doc.type,
    entityId: doc.id,
    entityNum: doc.num,
  });

  return doc;
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, customer: true },
  });
}

export async function listDocuments(type?: "PROFORMA" | "DEFINITIVE") {
  return prisma.document.findMany({
    where: type ? { type } : undefined,
    include: { items: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(id: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;

  await prisma.document.delete({ where: { id } });

  await createAuditEvent({
    action: "DOCUMENT_DELETED",
    entityType: doc.type,
    entityId: doc.id,
    entityNum: doc.num,
  });
}
