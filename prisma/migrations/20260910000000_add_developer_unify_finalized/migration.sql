-- P0: add DEVELOPER to UserRole; canonicalize finalized status to EMISE.
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block on
-- some PostgreSQL versions. If `prisma migrate deploy` fails on the ALTER
-- TYPE statement, run that single statement manually via psql, then re-run
-- deploy (backfills below are idempotent).

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DEVELOPER';

-- Backfill legacy FINALIZED rows to canonical EMISE (transitional; code
-- accepts both, dashboards aggregate both).
UPDATE "documents" SET "status" = 'EMISE' WHERE "status" = 'FINALIZED';
UPDATE "delivery_notes" SET "status" = 'EMISE' WHERE "status" = 'FINALIZED';
