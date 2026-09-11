# ADR-007: Server-Side Document Number Sequences

## Status
Accepted

## Context
Commercial documents in Senegal require sequential, gapless numbering for legal compliance (e.g., `PF-2026-001`, `FAC-2026-042`, `BL-2026-015`). Number generation must be atomic and survive concurrent requests.

## Decision
We use a **database-backed sequence table** (`DocumentSequence`) with optimistic locking:

```prisma
model DocumentSequence {
  type       String // "PROFORMA", "DEFINITIVE", "DELIVERY"
  year       Int
  nextNumber Int    // incremented atomically
  @@unique([type, year])
}
```

Number generation logic (`getNextNumber` in `src/lib/services/documents.ts`):
1. Find or create the sequence row for `{type, year}`
2. Atomically increment `nextNumber`
3. Format as `{PREFIX}-{YEAR}-{PADDED_NUMBER}` (e.g., `PF-2026-001`)
4. Retry up to 3 times on unique constraint conflicts (concurrent generation)

Number format:
- Proforma: `PF-{year}-{3-digit}` (e.g., `PF-2026-001`)
- Definitive: `FAC-{year}-{3-digit}` (e.g., `FAC-2026-042`)
- Delivery: `BL-{year}-{3-digit}` (e.g., `BL-2026-015`)

We rejected:
- **UUIDs**: Not human-readable;不符合当地商业惯例
- **Database auto-increment**: Per-table, not per-type-year; no year rollover
- **Redis sequences**: Adds infrastructure dependency; Prisma transactions provide sufficient atomicity
- **Client-side generation**: Vulnerable to race conditions and manipulation

## Consequences
- **Positive**: Gapless sequential numbers per type per year; year rollover is automatic; concurrent requests are handled via retry + unique constraint; numbers are human-readable and auditable
- **Negative**: Sequence increment is a row-level lock; under extreme concurrency, retries may be needed (mitigated by 3-attempt retry loop)
- **Mitigation**: The sequence table is small and rarely contended; Prisma transactions keep the increment + document creation atomic
