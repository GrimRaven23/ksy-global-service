import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { snapshotCompany } from "./company";

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "P2002";
}

function deliveryCompanySnap(full: ReturnType<typeof snapshotCompany>) {
  return {
    companyName: full.companyName,
    companyAddr: full.companyAddr,
    companyCity: full.companyCity,
    companyPhone: full.companyPhone,
    companyRccm: full.companyRccm,
  };
}

async function getNextBLNumber(tx: TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BL-${year}-`;
  const existing = await tx.documentSequence.findUnique({
    where: { type_year: { type: "DELIVERY", year } },
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
      data: { type: "DELIVERY", year, nextNumber: 1 },
    });
    nextNumber = created.nextNumber;
  }

  const num = String(nextNumber).padStart(3, "0");
  return `${prefix}${num}`;
}

export async function createDeliveryNote(data: {
  date?: string;
  observations?: string;
  driverName?: string;
  driverPhone?: string;
  orderRef?: string;
  customerId?: string | null;
  customerName?: string;
  customerAddr?: string;
  customerPhone?: string;
  customerEmail?: string;
  documentId?: string | null;
  items: { designation: string; quantity: number; observation?: string; sortOrder?: number }[];
  userId?: string;
}) {
  const company = await prisma.companySettings.findUnique({ where: { id: "company_main" } });
  if (!company) throw new Error("Company settings not found");

  const companySnap = deliveryCompanySnap(snapshotCompany(company));
  const customerSnap = {
    customerName: data.customerName || null,
    customerAddr: data.customerAddr || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const num = await getNextBLNumber(tx);

        const doc = await tx.deliveryNote.create({
          data: {
            num,
            date: data.date ? new Date(data.date) : new Date(),
            observations: data.observations || null,
            driverName: data.driverName || null,
            driverPhone: data.driverPhone || null,
            orderRef: data.orderRef || null,
            customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
            document: data.documentId ? { connect: { id: data.documentId } } : undefined,
            company: { connect: { id: "company_main" } },
            ...companySnap,
            ...customerSnap,
            createdBy: data.userId || null,
            items: {
              create: data.items.map((item, i) => ({
                designation: item.designation,
                quantity: item.quantity,
                observation: item.observation || null,
                sortOrder: item.sortOrder ?? i,
              })),
            },
          },
          include: { items: true, customer: true, document: true },
        });

        return doc;
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

export async function updateDeliveryNote(
  id: string,
  data: Record<string, unknown>,
  opts?: { changedBy?: string }
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.deliveryNote.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new Error("Delivery note not found");

    const isStatusOnly =
      data.status !== undefined &&
      data.date === undefined &&
      data.observations === undefined &&
      data.driverName === undefined &&
      data.driverPhone === undefined &&
      data.orderRef === undefined &&
      data.customerId === undefined &&
      data.customerName === undefined &&
      data.customerAddr === undefined &&
      data.customerPhone === undefined &&
      data.customerEmail === undefined &&
      data.items === undefined;

    const updateData: Record<string, unknown> = {};
    if (!isStatusOnly && existing.status === "DRAFT") {
      const company = await tx.companySettings.findUnique({ where: { id: "company_main" } });
      if (!company) throw new Error("Company settings not found");
      Object.assign(updateData, deliveryCompanySnap(snapshotCompany(company)));
      if (data.customerName !== undefined) updateData.customerName = data.customerName as string;
      if (data.customerAddr !== undefined) updateData.customerAddr = data.customerAddr as string;
      if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone as string;
      if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail as string;
    }
    if (existing.status !== "DRAFT") {
      if (!isStatusOnly) throw new Error("Ce bon de livraison ne peut plus être modifié");
      updateData.status = data.status === "FINALIZED" ? "EMISE" : data.status;
      if (updateData.status === "EMISE" && !existing.finalizedAt) {
        updateData.finalizedAt = new Date();
        updateData.finalizedBy = opts?.changedBy ?? null;
      }
      return tx.deliveryNote.update({
        where: { id },
        data: updateData,
        include: { items: true, customer: true, document: true },
      });
    }
    if (data.date !== undefined) updateData.date = new Date(data.date as string);
    if (data.observations !== undefined) updateData.observations = data.observations as string;
    if (data.driverName !== undefined) updateData.driverName = data.driverName as string;
    if (data.driverPhone !== undefined) updateData.driverPhone = data.driverPhone as string;
    if (data.orderRef !== undefined) updateData.orderRef = data.orderRef as string;
    if (data.status !== undefined) updateData.status = data.status === "FINALIZED" ? "EMISE" : data.status;
    if (updateData.status === "EMISE" && !existing.finalizedAt) {
      updateData.finalizedAt = new Date();
      updateData.finalizedBy = opts?.changedBy ?? null;
    }
    if (data.customerId !== undefined) {
      updateData.customer = data.customerId
        ? { connect: { id: data.customerId as string } }
        : { disconnect: true };
    }

    if (data.items && Array.isArray(data.items)) {
      await tx.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } });
      const items = data.items as { designation: string; quantity: number; observation?: string; sortOrder?: number }[];
      updateData.items = {
        create: items.map((item, i) => ({
          designation: item.designation,
          quantity: item.quantity,
          observation: item.observation || null,
          sortOrder: item.sortOrder ?? i,
        })),
      };
    }

    return tx.deliveryNote.update({
      where: { id },
      data: updateData,
      include: { items: true, customer: true, document: true },
    });
  });
}

export async function getDeliveryNote(id: string) {
  return prisma.deliveryNote.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, customer: true, document: true },
  });
}

export async function listDeliveryNotes(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.deliveryNote.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true, customer: true, document: true },
      skip,
      take: pageSize,
    }),
    prisma.deliveryNote.count(),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function deleteDeliveryNote(id: string) {
  return prisma.deliveryNote.delete({ where: { id } });
}
