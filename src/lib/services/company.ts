import { prisma } from "@/lib/prisma";
import type { CompanySettings } from "@prisma/client";

export type CompanyData = CompanySettings;

export async function getCompany(): Promise<CompanyData> {
  const existing = await prisma.companySettings.findUnique({
    where: { id: "company_main" },
  });
  if (existing) return existing;

  return prisma.companySettings.create({
    data: { id: "company_main" },
  });
}

export async function updateCompany(data: Partial<CompanyData>) {
  const { id, createdAt, updatedAt, ...rest } = data as any;
  return prisma.companySettings.upsert({
    where: { id: "company_main" },
    create: { id: "company_main", ...rest },
    update: rest,
  });
}

export function snapshotCompany(c: CompanyData) {
  return {
    companyName: c.name,
    companyAddr: c.address,
    companyCity: c.city,
    companyPhone: c.phone,
    companyRccm: c.rccm,
    companyNinea: c.ninea,
    companyIban: c.iban,
  };
}
