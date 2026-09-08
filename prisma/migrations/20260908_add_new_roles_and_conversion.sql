-- Migration: Add new roles, document statuses, conversion tracking, indexes
-- Run this on Supabase SQL Editor before deploying

-- 1. Add new enum values for UserRole (if not already present)
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ACCOUNTANT';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PROJECT_MANAGER';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPLIANCE';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'WAREHOUSE';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Add new enum values for DocumentStatus (if not already present)
DO $$ BEGIN
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'EMISE';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Add new enum values for AuditAction (if not already present)
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_CONVERTED';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Add convertedFromId column to documents table
DO $$ BEGIN
  ALTER TABLE "documents" ADD COLUMN "converted_from_id" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- 5. Add foreign key for convertedFromId
DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_converted_from_id_fkey"
    FOREIGN KEY ("converted_from_id") REFERENCES "documents"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Add indexes on documents table
CREATE INDEX IF NOT EXISTS "documents_customer_id_idx" ON "documents"("customer_id");
CREATE INDEX IF NOT EXISTS "documents_company_id_idx" ON "documents"("company_id");
CREATE INDEX IF NOT EXISTS "documents_created_by_idx" ON "documents"("created_by");
CREATE INDEX IF NOT EXISTS "documents_converted_from_id_idx" ON "documents"("converted_from_id");

-- 7. Add indexes on delivery_notes table
CREATE INDEX IF NOT EXISTS "delivery_notes_customer_id_idx" ON "delivery_notes"("customer_id");
CREATE INDEX IF NOT EXISTS "delivery_notes_document_id_idx" ON "delivery_notes"("document_id");
CREATE INDEX IF NOT EXISTS "delivery_notes_created_by_idx" ON "delivery_notes"("created_by");
