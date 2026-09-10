import { prisma } from "@/lib/prisma";
import { hashPassword, generateRandomPassword } from "@/lib/auth/password";

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

  // Create default owner user — OWNER_PASSWORD is mandatory (no default).
  const ownerEmail = process.env.OWNER_EMAIL || "admin@ksy-global.com";
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerPassword || ownerPassword.length < 12) {
    throw new Error("OWNER_PASSWORD manquant ou trop court (min 12 caractères). Définissez OWNER_PASSWORD puis relancez.");
  }
  const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    await prisma.user.create({
      data: {
        email: ownerEmail,
        name: "Administrateur KSY",
        passwordHash: hashPassword(ownerPassword),
        role: "OWNER",
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });
    console.log(`✓ Default owner created (${ownerEmail}) — mot de passe initial à changer à la première connexion.`);
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
