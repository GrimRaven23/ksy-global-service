import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  console.log("Seeding database...");

  // Create company settings
  await prisma.companySettings.upsert({
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
  console.log("✓ Company settings created");

  // Create document sequences
  const year = new Date().getFullYear();
  for (const type of ["PROFORMA", "DEFINITIVE", "DELIVERY"]) {
    await prisma.documentSequence.upsert({
      where: { type_year: { type, year } },
      update: {},
      create: { type, year, nextNumber: 1 },
    });
  }
  console.log("✓ Document sequences created");

  // Create default owner user
  const ownerEmail = "admin@ksy-global.com";
  const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    await prisma.user.create({
      data: {
        email: ownerEmail,
        name: "Administrateur KSY",
        passwordHash: hashPassword("Admin@12345"),
        role: "OWNER",
        status: "ACTIVE",
      },
    });
    console.log("✓ Default owner created (admin@ksy-global.com / Admin@12345)");
  } else {
    console.log("✓ Owner user already exists");
  }

  console.log("Seeding complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Seeding error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
