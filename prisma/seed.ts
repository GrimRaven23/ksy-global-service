import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.companySettings.upsert({
    where: { id: "company_main" },
    update: {},
    create: {
      id: "company_main",
      name: "KSY GLOBAL SERVICE",
      slogan: "KNOWLEDGE • SERVICE • YIELD",
      activite: "Fourniture de consommables & services associés",
      city: "Dakar, Sénégal",
      tvaDefault: "non",
      tvaRate: 18,
      currency: "XOF",
    },
  });

  console.log("✓ Company settings initialized:", company.name);

  const sequences = [
    { type: "PROFORMA", year: new Date().getFullYear(), nextNumber: 1 },
    { type: "DEFINITIVE", year: new Date().getFullYear(), nextNumber: 1 },
    { type: "DELIVERY", year: new Date().getFullYear(), nextNumber: 1 },
  ];

  for (const seq of sequences) {
    await prisma.documentSequence.upsert({
      where: { type_year: { type: seq.type, year: seq.year } },
      update: {},
      create: seq,
    });
  }

  console.log("✓ Document sequences initialized");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
