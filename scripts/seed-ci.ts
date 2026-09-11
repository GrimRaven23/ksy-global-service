import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const TEST_EMAIL = process.env.TEST_EMAIL || "admin@ksy-global.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Admin@12345";
const OWNER_NAME = "Administrateur KSY";

const ITERATIONS = 310000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `pbkdf2$${ITERATIONS}$${salt}$${hash.toString("hex")}`;
}

async function main() {
  console.log("Seeding CI database...");

  const dbUrl = process.env.DATABASE_URL || "";
  const isTestDb = /localhost|127\.0\.0\.1|ksy_test|_test([:/]|$)/.test(dbUrl);
  if (!isTestDb) {
    throw new Error("seed-ci refuse de s'exécuter hors base de test (DATABASE_URL doit viser localhost/ksy_test).");
  }

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

  const year = new Date().getFullYear();
  for (const type of ["PROFORMA", "DEFINITIVE", "DELIVERY"]) {
    await prisma.documentSequence.upsert({
      where: { type_year: { type, year } },
      update: {},
      create: { type, year, nextNumber: 1 },
    });
  }
  console.log("✓ Document sequences created");

  const existingOwner = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!existingOwner) {
    await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: OWNER_NAME,
        passwordHash: hashPassword(TEST_PASSWORD),
        role: "OWNER",
        status: "ACTIVE",
        mustChangePassword: false,
      },
    });
    console.log(`✓ Test user created (${TEST_EMAIL})`);
  } else {
    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: {
        passwordHash: hashPassword(TEST_PASSWORD),
        mustChangePassword: false,
        status: "ACTIVE",
        role: "OWNER",
      },
    });
    console.log(`✓ Test user updated (${TEST_EMAIL})`);
  }

  console.log("CI seeding complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Seeding error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
