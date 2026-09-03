import { prisma } from "@/lib/prisma";
import type { CompanySettings } from "@prisma/client";

export async function getCompany(): Promise<CompanySettings | null> {
  return prisma.companySettings.findUnique({ where: { id: "company_main" } });
}

export async function updateCompany(data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, documents, deliveryNotes, ...rest } = data;
  const allowed = [
    "name", "slogan", "activite", "address", "city", "phone", "phone2",
    "email", "web", "rccm", "ninea", "ifu", "bank", "bkName", "iban",
    "swift", "compte", "tvaDefault", "tvaRate", "currency", "logoUrl", "cachetUrl",
  ];
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in rest) filtered[key] = rest[key];
  }
  return prisma.companySettings.update({
    where: { id: "company_main" },
    data: filtered,
  });
}

export function snapshotCompany(c: CompanySettings) {
  return {
    companyName: c.name,
    companyAddr: c.address,
    companyCity: c.city,
    companyPhone: c.phone,
    companyEmail: c.email,
    companyRccm: c.rccm,
    companyNinea: c.ninea,
    companyIfu: c.ifu,
    companyBank: c.bank,
    companyBkName: c.bkName,
    companyIban: c.iban,
    companySwift: c.swift,
    companyCompte: c.compte,
  };
}
