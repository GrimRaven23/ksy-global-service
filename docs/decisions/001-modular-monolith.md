# ADR-001: Modular Monolith over Microservices

## Status
Accepted

## Context
KSY Global Service is a Senegalese commercial document management platform serving SMBs. The team needs to decide on the high-level architecture to balance development speed, operational complexity, and deployment reliability.

## Decision
We adopt a **modular monolith** architecture using Next.js App Router with well-separated service layers:
- `src/lib/services/` contains domain logic (documents, customers, users, delivery notes, audit, etc.)
- `src/app/api/` routes serve as thin HTTP handlers that delegate to services
- `src/lib/authorization.ts`, `src/lib/validation.ts`, `src/lib/auth/` handle cross-cutting concerns
- Database access is centralized through `src/lib/prisma.ts`

We explicitly rejected microservices because:
1. The team is small and the domain is cohesive (commercial documents for a single business context)
2. Operational overhead of service mesh, inter-service auth, distributed transactions is disproportionate to the value
3. Vercel's serverless deployment model already provides isolation at the route level
4. Prisma provides a clean data access layer without needing separate data stores

## Consequences
- **Positive**: Single deployment unit, shared type safety across all layers, straightforward local development, atomic database transactions
- **Negative**: Must be disciplined about service boundaries to prevent spaghetti code; scaling is vertical rather than horizontal per-service
- **Mitigation**: Enforce module boundaries via import conventions (services never import from other app routes); use Prisma transactions for multi-step operations
