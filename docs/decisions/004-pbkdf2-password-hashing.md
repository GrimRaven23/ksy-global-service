# ADR-004: PBKDF2 Password Hashing with 310k Iterations

## Status
Accepted

## Context
User passwords must be stored securely. The application runs on Vercel serverless functions where bcrypt's native dependency can cause deployment issues.

## Decision
We use **Node.js built-in `crypto.pbkdf2`** with:
- **310,000 iterations** (OWASP 2023 recommendation for PBKDF2-SHA256)
- **64-byte salt** (generated via `crypto.randomBytes`)
- **64-byte key length**
- **SHA-256** digest

Storage format: `pbkdf2$310000$<hex-salt>$<hex-hash>`

We rejected:
- **bcrypt**: Requires native compilation; problematic on Vercel's serverless runtime
- **argon2**: Same native dependency issue as bcrypt
- **scrypt**: Less battle-tested than PBKDF2 for this use case
- **SHA-256 alone**: Not designed for password hashing; vulnerable to rainbow tables

## Consequences
- **Positive**: Zero native dependencies, uses Web Crypto API available in all Node.js runtimes, OWASP-compliant iteration count, consistent behavior across local/CI/production
- **Negative**: PBKDF2 is slower than bcrypt per verification (by design); ~500ms per hash on Vercel cold start
- **Mitigation**: Login attempts are rate-limited (5/minute); session tokens are long-lived (4h/8h) to reduce hash frequency
