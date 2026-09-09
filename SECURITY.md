# Security — KSY Global Service

## Authentication

### Session Management

- **Token type**: HMAC-SHA256 signed session tokens
- **Storage**: HttpOnly, Secure, SameSite=Lax cookies
- **Lifetime**: 8 hours
- **Rotation**: New token created on login
- **Revocation**: Session destroyed on logout

### Password Security

- **Hashing**: PBKDF2 with SHA-512, 100,000 iterations, 64-byte key
- **Salt**: 16-byte random salt per password
- **Storage**: `salt:hash` format in database
- **Policy**: Minimum 8 characters for new passwords
- **Temporary passwords**: Random 16-character passwords for new users

### CSRF Protection

- **Method**: Double-submit cookie pattern
- **Implementation**: Random 32-byte hex token
- **Cookie**: `csrf_token`, not HttpOnly, SameSite=Strict
- **Header**: `x-csrf-token`
- **Validation**: Timing-safe comparison via `crypto.timingSafeEqual`

## Authorization

### Role-Based Access Control (RBAC)

All API endpoints enforce role-based permissions. See [RBAC_PERMISSION_MATRIX.md](./RBAC_PERMISSION_MATRIX.md) for the complete matrix.

### Object-Level Authorization

Users can only access records they created, unless they have admin-level roles (OWNER, IT_ADMIN, ADMIN).

### Self-Edit Restriction

Users cannot change their own role or status through the API.

### Last Owner Protection

The last active OWNER cannot be disabled or deleted.

## Input Validation

### Server-Side Validation

All API inputs are validated using Zod schemas:

- **Strings**: Length limits enforced
- **Emails**: Format validated
- **Numbers**: Range limits enforced
- **Enums**: Restricted to allowed values
- **Required fields**: Checked

### SQL Injection Prevention

- Prisma ORM parameterizes all queries
- No raw SQL with user input
- Database queries use type-safe Prisma Client

## Output Protection

### XSS Prevention

- React automatically escapes HTML in JSX
- Customer/product names treated as untrusted input
- Content-Security-Policy header in production

### Sensitive Data Masking

Company bank details (IBAN, SWIFT, account numbers) are masked for users without `company.read_sensitive` permission.

### Error Message Sanitization

Internal error details are not returned to the client. Generic error messages are shown instead.

## Rate Limiting

### Login Rate Limiting

- **Key**: IP address
- **Limit**: 5 attempts per 10 minutes
- **Storage**: Database-backed (survives serverless cold starts)

### API Rate Limiting

- **Key**: IP address
- **Limit**: 100 requests per minute
- **Storage**: Database-backed

## Security Headers

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer control |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Feature restrictions |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS enforcement (production) |
| `Content-Security-Policy` | See CSP section | XSS/injection prevention (production) |

### Content Security Policy (Production)

```
default-src 'self';
script-src 'self' 'nonce-{nonce}';
style-src 'self' 'nonce-{nonce}';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
upgrade-insecure-requests;
```

## Secrets Management

### Environment Variables

| Variable | Sensitivity | Storage |
|---|---|---|
| `DATABASE_URL` | Secret | Vercel Environment Variable |
| `DIRECT_URL` | Secret | Vercel Environment Variable |
| `SESSION_SECRET` | Secret | Vercel Environment Variable |
| `NODE_ENV` | Public | Vercel Environment Variable |

### Git Safety

- `.env` files are gitignored
- `.env.local` contains development credentials (never committed to production)
- `.env.example` documents required variables without real values

## Audit Trail

### Events Tracked

| Category | Events |
|---|---|
| Authentication | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_CHANGED` |
| Users | `USER_CREATED`, `USER_DISABLED`, `USER_ENABLED`, `USER_UPDATED`, `USER_DELETED`, `ROLE_CHANGED` |
| Documents | `DOCUMENT_CREATED`, `DOCUMENT_UPDATED`, `DOCUMENT_PRINTED`, `DOCUMENT_FINALIZED`, `DOCUMENT_CANCELLED`, `DOCUMENT_DELETED`, `DOCUMENT_CONVERTED` |
| Delivery | `DELIVERY_NOTE_CREATED`, `DELIVERY_NOTE_UPDATED`, `DELIVERY_NOTE_PRINTED`, `DELIVERY_NOTE_CONFIRMED`, `DELIVERY_NOTE_DELETED` |
| Company | `COMPANY_SETTINGS_UPDATED` |

### Audit Event Structure

```typescript
{
  id: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityNum?: string;
  userId?: string;
  details?: Json;
  ipAddress?: string;
  createdAt: DateTime;
}
```

## Database Security

### Least Privilege

- Application uses a dedicated database user
- Migration user has additional DDL permissions
- No shared credentials between environments

### Connection Security

- SSL required for all connections
- Connection pooling via PgBouncer (Supabase)
- Connection limits enforced

## Incident Response

### Suspected Compromise

1. Check audit log for suspicious events
2. Review recent login events
3. Check for unauthorized role changes
4. Verify company settings haven't been modified
5. Rotate `SESSION_SECRET` if session compromise suspected

### Data Breach

1. Identify scope of affected data
2. Preserve audit trail
3. Document incident
4. Notify affected parties as required by law

## Dependency Security

### Automated Scanning

- Run `npm audit` regularly
- Review and address vulnerabilities
- Update vulnerable dependencies

### Manual Review

- Review new dependencies before adding
- Check for maintenance status
- Verify no malicious code

## Deployment Security

### Production Checklist

- [ ] HTTPS enforced
- [ ] Environment variables set (not in code)
- [ ] Database credentials secured
- [ ] SESSION_SECRET is strong and unique
- [ ] No development bypasses active
- [ ] Security headers enabled
- [ ] Rate limiting active
- [ ] CSRF protection active
- [ ] Audit logging active

### Preview Environment

- Preview deployments should not have production database access
- Use separate database for preview environments
- Never commit real credentials
