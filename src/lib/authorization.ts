import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

export async function canAccessDocument(user: SessionUser, documentId: string): Promise<boolean> {
  if (user.role === "OWNER" || user.role === "IT_ADMIN" || user.role === "ADMIN") {
    return true;
  }
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { createdBy: true },
  });
  if (!doc) return false;
  if (doc.createdBy === user.id) return true;
  return ["ACCOUNTANT", "COMPLIANCE", "VIEWER"].includes(user.role);
}

export async function canAccessDeliveryNote(user: SessionUser, deliveryNoteId: string): Promise<boolean> {
  if (user.role === "OWNER" || user.role === "IT_ADMIN" || user.role === "ADMIN") {
    return true;
  }
  const bl = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    select: { createdBy: true },
  });
  if (!bl) return false;
  if (bl.createdBy === user.id) return true;
  return ["ACCOUNTANT", "COMPLIANCE", "VIEWER"].includes(user.role);
}

export async function canAccessCustomer(user: SessionUser, customerId: string): Promise<boolean> {
  if (user.role === "OWNER" || user.role === "IT_ADMIN" || user.role === "ADMIN") {
    return true;
  }
  return ["ACCOUNTANT", "COMPLIANCE", "VIEWER"].includes(user.role);
}

export function canEditDocument(status: string): boolean {
  return status === "DRAFT";
}

export function canFinalizeDocument(status: string): boolean {
  return status === "DRAFT" || status === "EMISE";
}

export function canCancelDocument(status: string): boolean {
  return status !== "CANCELLED" && status !== "CONVERTED";
}

export function canDeleteDocument(status: string): boolean {
  return status === "DRAFT" || status === "CANCELLED";
}

export function canEditDeliveryNote(status: string): boolean {
  return status === "DRAFT";
}

export function canConfirmDeliveryNote(status: string): boolean {
  return status === "DRAFT" || status === "EMISE";
}
