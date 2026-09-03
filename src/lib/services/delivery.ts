import { prisma } from "@/lib/prisma";
import { curYear, padN } from "@/lib/utils";
import { snapshotCompany, getCompany } from "./company";
import { createAuditEvent } from "./audit";

export async function createDeliveryNote(data: {
  num?: string;
  date?: Date;
  ref?: string;
  driverName?: string;
  driverPhone?: string;
  customerId?: string;
  documentId?: string;
  observations?: string;
  items?: { designation: string; quantity: number; observation?: string }[];
}) {
  const company = await getCompany();
  const num = data.num || (await getNextBLNumber());

  const doc = await prisma.deliveryNote.create({
    data: {
      num,
      date: data.date || new Date(),
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      observations: data.observations,
      customerId: data.customerId,
      documentId: data.documentId,
      companyId: "company_main",
      companyName: company.name,
      companyAddr: company.address,
      companyCity: company.city,
      companyPhone: company.phone,
      companyRccm: company.rccm,
      items: {
        create: (data.items || []).map((item, i) => ({
          designation: item.designation,
          quantity: item.quantity,
          observation: item.observation,
          sortOrder: i,
        })),
      },
    },
    include: { items: true, customer: true, document: true },
  });

  await createAuditEvent({
    action: "DELIVERY_NOTE_CREATED",
    entityType: "DELIVERY_NOTE",
    entityId: doc.id,
    entityNum: doc.num,
  });

  return doc;
}

export async function updateDeliveryNote(
  id: string,
  data: {
    num?: string;
    date?: Date;
    ref?: string;
    driverName?: string;
    driverPhone?: string;
    customerId?: string;
    status?: string;
    observations?: string;
    items?: { designation: string; quantity: number; observation?: string; sortOrder: number }[];
  }
) {
  const company = await getCompany();
  const updateData: any = {
    ...(data.num !== undefined && { num: data.num }),
    ...(data.date !== undefined && { date: data.date }),
    ...(data.driverName !== undefined && { driverName: data.driverName }),
    ...(data.driverPhone !== undefined && { driverPhone: data.driverPhone }),
    ...(data.customerId !== undefined && { customerId: data.customerId }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.observations !== undefined && { observations: data.observations }),
    companyName: company.name,
    companyAddr: company.address,
    companyCity: company.city,
    companyPhone: company.phone,
    companyRccm: company.rccm,
  };

  if (data.items) {
    await prisma.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } });
    updateData.items = {
      create: data.items.map((item) => ({
        designation: item.designation,
        quantity: item.quantity,
        observation: item.observation,
        sortOrder: item.sortOrder,
      })),
    };
  }

  const doc = await prisma.deliveryNote.update({
    where: { id },
    data: updateData,
    include: { items: true, customer: true },
  });

  await createAuditEvent({
    action: "DELIVERY_NOTE_UPDATED",
    entityType: "DELIVERY_NOTE",
    entityId: doc.id,
    entityNum: doc.num,
  });

  return doc;
}

export async function getDeliveryNote(id: string) {
  return prisma.deliveryNote.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, customer: true, document: true },
  });
}

export async function listDeliveryNotes() {
  return prisma.deliveryNote.findMany({
    include: { items: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDeliveryNote(id: string) {
  const doc = await prisma.deliveryNote.findUnique({ where: { id } });
  if (!doc) return;

  await prisma.deliveryNote.delete({ where: { id } });

  await createAuditEvent({
    action: "DELIVERY_NOTE_DELETED",
    entityType: "DELIVERY_NOTE",
    entityId: doc.id,
    entityNum: doc.num,
  });
}

async function getNextBLNumber(): Promise<string> {
  const year = curYear();
  const seq = await prisma.documentSequence.upsert({
    where: { type_year: { type: "DELIVERY", year } },
    create: { type: "DELIVERY", year, nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
  });
  return `BL-${year}-${padN(seq.nextNumber - 1)}`;
}
