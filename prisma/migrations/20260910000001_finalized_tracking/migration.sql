-- P1: track who finalized and when (historical integrity).
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMPTZ;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "finalized_by" TEXT;
ALTER TABLE "delivery_notes" ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMPTZ;
ALTER TABLE "delivery_notes" ADD COLUMN IF NOT EXISTS "finalized_by" TEXT;

-- Backfill: already-finalized rows keep their last update as finalized date.
UPDATE "documents" SET "finalized_at" = "updated_at" WHERE "status" IN ('EMISE', 'FINALIZED') AND "finalized_at" IS NULL;
UPDATE "delivery_notes" SET "finalized_at" = "updated_at" WHERE "status" IN ('EMISE', 'FINALIZED') AND "finalized_at" IS NULL;
