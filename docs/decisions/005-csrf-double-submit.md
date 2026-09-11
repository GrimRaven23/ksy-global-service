# ADR-005: CSRF Double-Submit Cookie Pattern

## Status
Accepted

## Context
The application uses cookie-based sessions for authentication. Cross-site request forgery attacks could trick authenticated users into performing unwanted actions.

## Decision
We implement the **double-submit cookie** CSRF protection pattern:

1. On first request, the server generates a random CSRF token and stores it in a `XSRF-TOKEN` cookie (readable by JavaScript)
2. Every mutating request (POST, PUT, DELETE) must include the token in the `X-CSRF-Token` header
3. The middleware compares the cookie value against the header value; mismatch → 403
4. **Read-only requests (GET, HEAD, OPTIONS) are exempt** from CSRF validation

Implementation:
- `src/lib/csrf.ts`: `csrfFetch()` wrapper that auto-reads the cookie and sets the header
- `src/middleware.ts`: Validates the double-submit on mutating routes

We rejected:
- **Synchronizer Token Pattern**: Requires server-side token storage; harder in serverless
- **SameSite cookie only**: Not supported by all browsers in legacy mode; double-submit is defense-in-depth
- **Referer/Origin checking**: Unreliable with CDNs and redirects

## Consequences
- **Positive**: Stateless (no server-side token store), works across serverless instances, automatic with `csrfFetch()`, read-only requests pass through without overhead
- **Negative**: Vulnerable to subdomain takeover attacks (attacker on `evil.example.com` can set cookies for `example.com`); mitigated by HTTPS-only cookies
- **Mitigation**: Cookies are set with `SameSite=Lax` and `Secure` flags; all traffic is HTTPS
