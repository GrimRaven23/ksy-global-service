# DATABASE — KSY Global Service

> Source of truth: `prisma/schema.prisma`. This file mirrors it; if they
> disagree, the schema wins.

## Engine

PostgreSQL via Supabase (`DATABASE_URL` pooled pgBouncer, `DIRECT_URL` direct).
Prisma ORM v6. Health probe: `GET /api/health` runs `SELECT 1`.

## Entities

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Accounts. `role: UserRole`, `status`, `mustChangePassword`, `lastLoginAt`. |
| `CompanySettings` | `company_settings` | Single row `company_main`. Legal, contact, bank, TVA defaults. |
| `Customer` | `customers` | Persistent clients. Indexed on `name`, `phone`. |
| `Document` | `documents` | PROFORMA + DEFINITIVE. `@unique num`. Snapshots (company + customer), `convertedFromId @unique`, `finalizedAt/By`. |
| `DocumentItem` | `document_items` | Lines, cascade-delete with document. |
| `DocumentVersion` | `document_versions` | `@@unique(documentId, version)`. Written in-transaction on every create/update/status change/conversion. |
| `DeliveryNote` | `delivery_notes` | BL. `@unique num`, optional `documentId`, snapshots, `finalizedAt/By`. |
| `DeliveryNoteItem` | `delivery_note_items` | BL lines, cascade-delete. |
| `AuditEvent` | `audit_events` | Who/what/when per critical op. Indexed `(action)`, `(entityType, entityId)`, `(userId)`, `(createdAt)`. |
| `DocumentSequence` | `document_sequences` | `@@unique(type, year)`. `PROFORMA→PF-YYYY-NNN`, `DEFINITIVE→FAC-YYYY-NNN`, `DELIVERY→BL-YYYY-NNN`. |
| `RateLimit` | `rate_limits` | DB-backed throttling. |

## Relationships

```
CompanySettings 1───* Document / DeliveryNote
Customer 1───* Document / DeliveryNote
Document 1───* DocumentItem (cascade)
Document 1───* DeliveryNote (documentId, restrict on delete if linked)
Document 1───0/1 Document (convertedFromId @unique: PF → DF)
User 1───* AuditEvent
```

## Statuses (canonical)

`DRAFT → EMISE` (finalisée), `→ CANCELLED`, PF `→ CONVERTED`.
Legacy `FINALIZED` rows are backfilled to `EMISE` (migration
`20260910000000`); code normalizes `FINALIZED→EMISE` and aggregates both.

## Migrations

| Migration | Content |
|---|---|
| `20260909*` | Baseline: rate limits, conversion link, must-change-password, versions + indexes. |
| `20260910000000` | `UserRole` += `DEVELOPER`; backfill `FINALIZED→EMISE`. ⚠️ `ADD VALUE` may need psql outside a transaction. |
| `20260910000001` | `finalized_at/by` on documents + delivery_notes; backfill from `updated_at`. |

DB unreachable from this environment during P0/P1 (Supabase P1001);
`migrate deploy` is a manual production step (see RUNBOOK/DEPLOY).
