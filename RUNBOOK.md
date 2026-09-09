# Operations Runbook — KSY Global Service

## 1. Deployment

### Vercel (Production)

**Trigger:** Push to `main` branch after CI passes.

**Steps:**
1. Merge PR to `main`
2. Vercel auto-deploys from GitHub integration
3. Verify deployment at `https://ksy-global-service.vercel.app`

**Environment Variables (Vercel Dashboard):**
| Variable | Purpose | Scope |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection (pooled) | Production |
| `DIRECT_URL` | PostgreSQL direct connection | Production |
| `SESSION_SECRET` | HMAC session signing (min 32 chars) | Production |
| `NEXTAUTH_SECRET` | Legacy/compat auth secret | Production |
| `NODE_ENV` | `production` | Production |

**Verification:**
```bash
curl https://ksy-global-service.vercel.app/api/health
# Should return: { "ok": true, "db": "connected", ... }
```

**Rollback:**
- Vercel Dashboard → Project → Deployments → Promote previous deployment

### Preview Deployments

Vercel automatically creates preview deployments for PRs. Preview URLs are posted as PR comments.

**Warning:** Preview deployments may connect to the same database as production unless a separate `DATABASE_URL` is configured.

## 2. Database Migration

### Applying Migrations (Remote Supabase)

Since `prisma migrate dev` cannot run against remote Supabase from dev:

**Option A: Supabase SQL Editor**
1. Open Supabase Dashboard → SQL Editor
2. Read the migration file from `prisma/migrations/<timestamp>_<name>/migration.sql`
3. Paste and execute the SQL

**Option B: Prisma CLI (if you have direct DB access)**
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**Order of migrations:**
1. `20260908165523_add_rate_limit_table`
2. `20260908172200_add_document_version_and_indexes`
3. `20260909000001_add_must_change_password`
4. `20260909000002_add_document_sequences_and_rate_limit`

**Verification:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should include: audit_events, company_settings, customers,
-- delivery_note_items, delivery_notes, document_items,
-- document_sequences, document_versions, documents,
-- rate_limits, users
```

## 3. Database Health

### Connection Check
```bash
curl -s https://ksy-global-service.vercel.app/api/health | jq .
```

Expected response:
```json
{
  "ok": true,
  "db": "connected",
  "company": "exists",
  "users": <count>,
  "latency": "<Nms>"
}
```

### If DB is Down
1. Check Supabase Dashboard → Health
2. Check connection pool limits
3. Verify `DATABASE_URL` hasn't changed
4. Check if Vercel is blocked by Supabase IP allowlist

## 4. Account Recovery

### Last OWNER Locked Out

**Option A: Reset via Supabase SQL Editor**
```sql
-- List active owners
SELECT id, email, name, status FROM users WHERE role = 'OWNER';

-- Reset a specific user's password
-- First generate hash locally, then:
UPDATE users
SET "passwordHash" = '<new-hash>',
    "mustChangePassword" = true
WHERE email = 'owner@example.com';
```

**Option B: Create new OWNER via SQL**
```sql
INSERT INTO users (id, email, name, "passwordHash", role, status, "mustChangePassword", "created_at", "updated_at")
VALUES (
  gen_random_uuid()::text,
  'recovery@example.com',
  'Recovery Owner',
  '<password-hash>',
  'OWNER',
  'ACTIVE',
  true,
  NOW(),
  NOW()
);
```

### Disabled Account Reactivation
```sql
UPDATE users SET status = 'ACTIVE' WHERE id = '<user-id>';
```

## 5. Incident Handling

### Application Returns 503
1. Check `/api/health` endpoint
2. Verify `SESSION_SECRET` environment variable exists
3. Check Supabase status
4. Review Vercel function logs

### Users Cannot Login
1. Check `/api/health` for DB connectivity
2. Verify no rate limiting is blocking (check IP-based limits)
3. Confirm user exists and status is `ACTIVE`
4. Check password is correct (or reset via SQL)

### Print Preview Shows Stale Data
1. Clear browser cache
2. Check that document was saved (verify `updated_at` in DB)
3. Verify company settings are loaded (check network tab for `/api/settings`)

### Audit Events Not Recording
1. Check `audit_events` table exists
2. Verify `userId` field is being populated
3. Check for Prisma errors in Vercel logs

## 6. Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Infinite loading | DB connection failure | Check `/api/health`, verify DB |
| 401 on all API | Missing SESSION_SECRET | Add to Vercel env vars |
| CSRF error | Token mismatch | Clear cookies, re-login |
| 429 Too Many Requests | Rate limit exceeded | Wait or adjust limits in middleware |
| Build fails | Prisma generate missing | `npx prisma generate` in build |
| Empty documents list | Auth issue | Check session cookie |

## 7. Print Failure Diagnostics

### Documents Print Blank
1. Check browser print settings (background graphics: ON)
2. Verify `.print-doc` elements have content
3. Check company settings have name populated

### Multiple Pages Instead of One
1. Check content height exceeds A4 (1123px)
2. Reduce product rows or description text
3. Verify `doc-page` height is set correctly

### Corner Decorations Clipped
1. Verify `overflow: hidden` on `.doc-page`
2. Check corner CSS is present
3. Verify `@media print` rules are applied

### BL Two Copies Not Working
1. Verify `printCopies` state is `2`
2. Check both `.print-doc` containers exist in DOM
3. Verify `page-break-before: always` CSS on second copy
