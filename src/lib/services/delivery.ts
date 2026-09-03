import { prisma } from "@/lib/prisma";
import { snapshotCompany } from "./company";

async function getNextBLNumber(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BL-${year}-`;
  const seq = await tx.documentSequence.upsert({
    where: { type_year: { type: "DELIVERY", year } },
    update: { nextNumber: { increment: 1 } },
    create: { type: "DELIVERY", year, nextNumber: 1 },
  });
  const num = String(seq.nextNumber).padStart(3, "0");
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

  const companySnap = snapshotCompany(company);
  const customerSnap = {
    customerName: data.customerName || null,
    customerAddr: data.customerAddr || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
  };

  return prisma.$transaction(async (tx: any) => {
    const num = await getNextBLNumber(tx);

    const doc = await tx.deliveryNote.create({
      data: {
        num,
        date: data.date ? new Date(data.date) : new Date(),
        observations: data.observations || null,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        orderRef: data.orderRef || null,
        customerId: data.customerId || null,
        documentId: data.documentId || null,
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
}

export async function updateDeliveryNote(id: string, data: Record<string, unknown>) {
  const company = await prisma.companySettings.findUnique({ where: { id: "company_main" } });
  if (!company) throw new Error("Company settings not found");

  const companySnap = snapshotCompany(company);
  const customerSnap: Record<string, string | null> = {};
  if (data.customerName !== undefined) customerSnap.customerName = data.customerName as string;
  if (data.customerAddr !== undefined) customerSnap.customerAddr = data.customerAddr as string;
  if (data.customerPhone !== undefined) customerSnap.customerPhone = data.customerPhone as string;
  if (data.customerEmail !== undefined) customerSnap.customerEmail = data.customerEmail as string;

  return prisma.$transaction(async (tx: any) => {
    const existing = await tx.deliveryNote.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new Error("Delivery note not found");

    const updateData: Record<string, unknown> = { ...companySnap, ...customerSnap };
    if (data.date !== undefined) updateData.date = new Date(data.date as string);
    if (data.observations !== undefined) updateData.observations = data.observations as string;
    if (data.driverName !== undefined) updateData.driverName = data.driverName as string;
    if (data.driverPhone !== undefined) updateData.driverPhone = data.driverPhone as string;
    if (data.orderRef !== undefined) updateData.orderRef = data.orderRef as string;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.customerId !== undefined) updateData.customerId = data.customerId as string | null;

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

export async function listDeliveryNotes() {
  return prisma.deliveryNote.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, customer: true, document: true },
    take: 100,
  });
}

export async function deleteDeliveryNote(id: string) {
  return prisma.deliveryNote.delete({ where: { id } });
}
