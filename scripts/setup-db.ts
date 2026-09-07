import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  console.log("\n🔧 KSY Global Service — Setup de la base de données\n");

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL n'est pas défini.");
    console.error("   Utilisation: DATABASE_URL=\"postgres://...\" npx tsx scripts/setup-db.ts");
    process.exit(1);
  }

  console.log("📡 URL de base de données détectée ✓");

  console.log("\n⚙️  Génération du client Prisma...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("\n📦 Création/mise à jour des tables...");
  execSync("npx prisma db push", { stdio: "inherit" });

  console.log("\n🌱 Initialisation des données par défaut...");
  const prisma = new PrismaClient();

  try {
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
    console.log("✓ Paramètres entreprise créés");

    const year = new Date().getFullYear();
    for (const type of ["PROFORMA", "DEFINITIVE", "DELIVERY"]) {
      await prisma.documentSequence.upsert({
        where: { type_year: { type, year } },
        update: {},
        create: { type, year, nextNumber: 1 },
      });
    }
    console.log("✓ Séquences de numérotation créées");

    const email = "admin@ksy-global.com";
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name: "Administrateur KSY",
          passwordHash: hashPassword("Admin@12345"),
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      console.log("✓ Utilisateur admin créé");
    } else {
      console.log("✓ Utilisateur admin déjà existant");
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ✅ Setup terminé avec succès !");
  console.log("═══════════════════════════════════════════════════");
  console.log("\n  🔑 Identifiants de connexion:");
  console.log("     Email:    admin@ksy-global.com");
  console.log("     Mot de passe: Admin@12345");
  console.log("\n  ⚠️  Changez ce mot de passe après la première connexion!");
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error("\n❌ Erreur lors du setup:", e);
  process.exit(1);
});
