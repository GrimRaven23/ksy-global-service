import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const DATABASE_URL = process.env.DATABASE_URL;

const CREATE_TABLES_SQL = `
DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('OWNER','IT_ADMIN','DEVELOPER','ADMIN','ACCOUNTANT','SALES','ASSISTANT','PROJECT_MANAGER','DELIVERY','WAREHOUSE','COMPLIANCE','VIEWER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','DISABLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "DocumentType" AS ENUM ('PROFORMA','DEFINITIVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SaleMode" AS ENUM ('DIRECTE','LIVRAISON'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT','EMISE','FINALIZED','CONVERTED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED','USER_DISABLED','LOGIN_SUCCESS','LOGIN_FAILURE','PASSWORD_CHANGED','ROLE_CHANGED','COMPANY_SETTINGS_UPDATED','DOCUMENT_CREATED','DOCUMENT_UPDATED','DOCUMENT_PRINTED','DOCUMENT_FINALIZED','DOCUMENT_CANCELLED','DOCUMENT_DELETED','DELIVERY_NOTE_CREATED','DELIVERY_NOTE_UPDATED','DELIVERY_NOTE_PRINTED','DELIVERY_NOTE_CONFIRMED','DELIVERY_NOTE_DELETED','CUSTOMER_CREATED','CUSTOMER_UPDATED','CUSTOMER_DELETED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "users" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"email" TEXT NOT NULL UNIQUE,"name" TEXT NOT NULL,"password_hash" TEXT NOT NULL,"role" "UserRole" NOT NULL DEFAULT 'SALES',"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',"last_login_at" TIMESTAMPTZ,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "company_settings" ("id" TEXT PRIMARY KEY DEFAULT 'company_main',"name" TEXT NOT NULL DEFAULT 'KSY GLOBAL SERVICE',"slogan" TEXT NOT NULL DEFAULT 'KNOWLEDGE • SERVICE • YIELD',"activite" TEXT NOT NULL DEFAULT 'Fourniture de consommables & services associés',"address" TEXT,"city" TEXT DEFAULT 'Dakar, Sénégal',"phone" TEXT,"phone2" TEXT,"email" TEXT,"web" TEXT,"rccm" TEXT,"ninea" TEXT,"ifu" TEXT,"bank" TEXT,"bk_name" TEXT,"iban" TEXT,"swift" TEXT,"compte" TEXT,"tva_default" TEXT NOT NULL DEFAULT 'non',"tva_rate" DECIMAL(5,2) NOT NULL DEFAULT 18,"currency" TEXT NOT NULL DEFAULT 'XOF',"logo_url" TEXT,"cachet_url" TEXT,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "customers" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"name" TEXT NOT NULL,"contact_name" TEXT,"address" TEXT,"city" TEXT,"phone" TEXT,"email" TEXT,"notes" TEXT,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "documents" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"type" "DocumentType" NOT NULL,"num" TEXT NOT NULL UNIQUE,"date" TIMESTAMPTZ NOT NULL DEFAULT now(),"validity" TIMESTAMPTZ,"order_ref" TEXT,"sale_mode" "SaleMode" NOT NULL DEFAULT 'DIRECTE',"status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',"tva_on" BOOLEAN NOT NULL DEFAULT false,"tva_rate" DECIMAL(5,2) NOT NULL DEFAULT 18,"subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,"tva_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,"total" DECIMAL(15,2) NOT NULL DEFAULT 0,"words_value" TEXT,"customer_id" TEXT REFERENCES "customers"("id"),"company_id" TEXT NOT NULL DEFAULT 'company_main' REFERENCES "company_settings"("id"),"company_name_snapshot" TEXT,"company_addr_snapshot" TEXT,"company_city_snapshot" TEXT,"company_phone_snapshot" TEXT,"company_email_snapshot" TEXT,"company_rccm_snapshot" TEXT,"company_ninea_snapshot" TEXT,"company_ifu_snapshot" TEXT,"company_bank_snapshot" TEXT,"company_bk_name_snapshot" TEXT,"company_iban_snapshot" TEXT,"company_swift_snapshot" TEXT,"company_compte_snapshot" TEXT,"customer_name_snapshot" TEXT,"customer_addr_snapshot" TEXT,"customer_phone_snapshot" TEXT,"customer_email_snapshot" TEXT,"created_by" TEXT,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_documents_type ON "documents"("type");CREATE INDEX IF NOT EXISTS idx_documents_status ON "documents"("status");CREATE INDEX IF NOT EXISTS idx_documents_date ON "documents"("date");CREATE INDEX IF NOT EXISTS idx_documents_num ON "documents"("num");
CREATE TABLE IF NOT EXISTS "document_items" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"designation" TEXT NOT NULL,"quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,"unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,"total" DECIMAL(15,2) NOT NULL DEFAULT 0,"sort_order" INTEGER NOT NULL DEFAULT 0,"document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_document_items_doc ON "document_items"("document_id");
CREATE TABLE IF NOT EXISTS "delivery_notes" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"num" TEXT NOT NULL UNIQUE,"date" TIMESTAMPTZ NOT NULL DEFAULT now(),"observations" TEXT,"status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',"driver_name" TEXT,"driver_phone" TEXT,"order_ref" TEXT,"customer_id" TEXT REFERENCES "customers"("id"),"document_id" TEXT REFERENCES "documents"("id"),"company_id" TEXT NOT NULL DEFAULT 'company_main' REFERENCES "company_settings"("id"),"company_name_snapshot" TEXT,"company_addr_snapshot" TEXT,"company_city_snapshot" TEXT,"company_phone_snapshot" TEXT,"company_rccm_snapshot" TEXT,"customer_name_snapshot" TEXT,"customer_addr_snapshot" TEXT,"customer_phone_snapshot" TEXT,"customer_email_snapshot" TEXT,"created_by" TEXT,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON "delivery_notes"("date");CREATE INDEX IF NOT EXISTS idx_delivery_notes_num ON "delivery_notes"("num");
CREATE TABLE IF NOT EXISTS "delivery_note_items" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"designation" TEXT NOT NULL,"quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,"observation" TEXT,"sort_order" INTEGER NOT NULL DEFAULT 0,"delivery_note_id" TEXT NOT NULL REFERENCES "delivery_notes"("id") ON DELETE CASCADE,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_delivery_note_items_dn ON "delivery_note_items"("delivery_note_id");
CREATE TABLE IF NOT EXISTS "audit_events" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"action" "AuditAction" NOT NULL,"entity_type" TEXT NOT NULL,"entity_id" TEXT,"entity_num" TEXT,"user_id" TEXT REFERENCES "users"("id"),"details" JSONB,"ip_address" TEXT,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON "audit_events"("action");CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON "audit_events"("entity_type","entity_id");CREATE INDEX IF NOT EXISTS idx_audit_events_user ON "audit_events"("user_id");CREATE INDEX IF NOT EXISTS idx_audit_events_date ON "audit_events"("created_at");
CREATE TABLE IF NOT EXISTS "document_sequences" ("id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"type" TEXT NOT NULL,"year" INTEGER NOT NULL,"next_number" INTEGER NOT NULL DEFAULT 1,"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE("type","year"));
`;

async function main() {
  console.log("\nKSY Global Service -- Setup de la base de donnees\n");

  if (!DATABASE_URL) {
    console.error("DATABASE_URL n'est pas defini.");
    process.exit(1);
  }

  console.log("URL de base de donnees detectee.");

  console.log("\nGeneration du client Prisma...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("\nCreation des tables via SQL direct...");
  const { Client } = await import("pg");
  const cleanUrl = DATABASE_URL.replace(/[?&]pgbouncer=true/g, "").replace(/[?&]sslmode=[^&]*/g, "");
  const client = new Client({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(CREATE_TABLES_SQL);
    console.log("Tables creees avec succes.");
  } catch (err) {
    console.error("Erreur lors de la creation des tables:", (err as Error).message);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log("\nInitialisation des donnees par defaut...");
  const prisma = new PrismaClient();

  try {
    await prisma.companySettings.upsert({
      where: { id: "company_main" },
      update: {},
      create: {
        id: "company_main",
        name: "KSY GLOBAL SERVICE",
        slogan: "KNOWLEDGE \u2022 SERVICE \u2022 YIELD",
        activite: "Fourniture de consommables & services associes",
        city: "Dakar, Senegal",
        tvaDefault: "non",
        tvaRate: 18,
        currency: "XOF",
      },
    });
    console.log("Parametres entreprise crees.");

    const year = new Date().getFullYear();
    for (const type of ["PROFORMA", "DEFINITIVE", "DELIVERY"]) {
      try {
        await prisma.documentSequence.create({
          data: { type, year, nextNumber: 1 },
        });
      } catch {
        // already exists
      }
    }
    console.log("Sequences de numerotation creees.");

    const email = process.env.OWNER_EMAIL || "admin@ksy-global.com";
    const ownerPassword = process.env.OWNER_PASSWORD;
    if (!ownerPassword || ownerPassword.length < 12) {
      console.error("OWNER_PASSWORD manquant ou trop court (min 12 caractères).");
      process.exit(1);
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name: "Administrateur KSY",
          passwordHash: hashPassword(ownerPassword),
          role: "OWNER",
          status: "ACTIVE",
          mustChangePassword: true,
        },
      });
      console.log("Utilisateur admin cree.");
    } else {
      console.log("Utilisateur admin deja existant.");
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n===========================================");
  console.log("  Setup termine avec succes !");
  console.log("===========================================");
  console.log("\n  Identifiants de connexion:");
  console.log("     Email:    admin@ksy-global.com (ou OWNER_EMAIL)");
  console.log("     Mot de passe: valeur de OWNER_PASSWORD (à changer à la première connexion)");
  console.log("\n  Changez ce mot de passe apres la premiere connexion!");
  console.log("===========================================\n");
}

main().catch((e) => {
  console.error("\nErreur lors du setup:", e);
  process.exit(1);
});
