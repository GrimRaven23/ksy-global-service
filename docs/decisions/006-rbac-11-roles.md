# ADR-006: Role-Based Access Control with 11 Roles

## Status
Accepted

## Context
The platform serves multiple user types within a Senegalese business: owners, accountants, warehouse staff, delivery drivers, sales agents, and external developers. Each needs different permissions.

## Decision
We implement **hierarchical RBAC** with 11 roles defined in `src/lib/types.ts`:

| Role | Scope |
|------|-------|
| OWNER | Full access to everything |
| IT_ADMIN | System management, user CRUD |
| ADMIN | Business operations, all modules |
| ACCOUNTANT | Documents, customers, financial data |
| COMPLIANCE | Read-only across all modules |
| SALES | Create/update documents, read customers |
| DELIVERY | Delivery notes, read documents |
| WAREHOUSE | Inventory-related read access |
| ASSISTANT | Limited document operations |
| PROJECT_MANAGER | Cross-module read, document create |
| DEVELOPER | API access for integrations |

Permissions are granular strings: `documents.create`, `documents.read`, `documents.update`, `documents.finalize`, `documents.delete`, `documents.print`, `customers.read`, `customers.create`, `audit.read`, etc.

Session tokens encode `{ id, email, role, status }` and are verified on every request via `requireAuth()`.

## Consequences
- **Positive**: Fine-grained access control; OWNER can delegate safely; audit trail tracks who did what; API endpoints enforce permissions at the handler level
- **Negative**: 11 roles may be excessive for early-stage product; some roles (WAREHOUSE, PROJECT_MANAGER) have minimal distinct permissions
- **Mitigation**: Roles are stored as an enum and can be consolidated later; permission checks use `hasPermission()` which is easy to extend
