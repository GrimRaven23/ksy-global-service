# Architecture — KSY Global Service

## Overview

KSY Global Service is a small business platform for managing invoices, delivery notes, customers, and company settings. It is built as a modular monolith with Next.js, Prisma, and PostgreSQL.

```
                         KSY GLOBAL SERVICE
                                  |
                         WEB APPLICATION
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
         DOCUMENTS             USERS/RBAC          SETTINGS
             |                    |                    |
       +-----+------+        +----+-----+              |
       |            |        |          |              |
       v            v        v          v              v
   INVOICES        BL      AUTH      PERMISSIONS   COMPANY CONFIG
       |
       +-----------> DOCUMENT RELATIONS
                                  |
                              PostgreSQL
                                  |
                           Audit / Versions
                                  |
                             CI/CD + IaC
                                  |
                         Production Platform
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6.19 |
| Authentication | Custom HMAC-based sessions |
| Testing | Vitest |
| Deployment | Vercel |

## Frontend Architecture

### Pages

| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Authentication |
| `/` | DashboardPage | Overview and stats |
| `/documents` | DocumentsPage | List all documents |
| `/documents/new` | DocumentEditor | Create/edit proforma |
| `/documents/new?type=df` | DocumentEditor | Create/edit definitive |
| `/bl` | BLEditor | Create/edit delivery notes |
| `/customers` | CustomersPage | Customer management |
| `/settings` | SettingsPage | Company settings |
| `/users` | UsersPage | User management |
| `/audit` | AuditPage | Audit log viewer |
| `/change-password` | ChangePasswordPage | Force password change |

### Components

| Component | Purpose |
|---|---|
| `AppShell` | Main layout with navigation |
| `DocumentEditor` | Proforma/Definitive invoice editor |
| `BLEditor` | Delivery note editor |
| `DocumentPrintTemplate` | A4 print template for invoices |
| `Toast` | Notification system |
| `ConfirmDialog` | Confirmation dialogs |
| `ErrorBoundary` | React error boundary |
| `ui` | Shared UI components (Button, Field, SectionTitle) |

### State Management

- Local component state with `useState`
- Ref-based dirty tracking (`useRef`)
- Debounced auto-save (1 second)
- No global state management (appropriate for app size)

## Backend Architecture

### API Routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/logout` | POST | Session termination |
| `/api/auth/change-password` | POST | Password change |
| `/api/auth/me` | GET | Current user info |
| `/api/documents` | GET, POST, PUT, DELETE | Document CRUD |
| `/api/documents/convert` | POST | Proforma → Definitive |
| `/api/documents/create-bl` | POST | Create BL from invoice |
| `/api/delivery` | GET, POST, PUT, DELETE | Delivery note CRUD |
| `/api/customers` | GET, POST, PUT, DELETE | Customer CRUD |
| `/api/settings` | GET, PUT | Company settings |
| `/api/users` | GET, POST, PUT | User management |
| `/api/users/[id]` | GET, PUT, DELETE | Individual user |
| `/api/users/[id]/reset-password` | POST | Admin password reset |
| `/api/audit` | GET | Audit log |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/health` | GET | Health check |

### Services

| Service | Purpose |
|---|---|
| `documents.ts` | Document CRUD, numbering, conversion |
| `delivery.ts` | Delivery note CRUD, numbering |
| `company.ts` | Company settings, snapshot |
| `audit.ts` | Audit event creation and querying |
| `document-versions.ts` | Document version tracking |

### Middleware

- Session token verification (HMAC-SHA256)
- CSRF protection (double-submit cookie)
- Rate limiting (database-backed)
- Security headers (CSP, HSTS, X-Frame-Options)

## Database Architecture

### Models

| Model | Purpose |
|---|---|
| `User` | User accounts with roles |
| `CompanySettings` | Company configuration (singleton) |
| `Customer` | Customer information |
| `Document` | Proforma and Definitive invoices |
| `DocumentItem` | Line items on documents |
| `DocumentVersion` | Document change history |
| `DeliveryNote` | Bon de Livraison |
| `DeliveryNoteItem` | Line items on delivery notes |
| `AuditEvent` | Audit trail |
| `DocumentSequence` | Auto-numbering sequences |
| `RateLimit` | Rate limiting state |

### Key Relationships

```
User (1) ──creates──> (N) Document
User (1) ──creates──> (N) DeliveryNote
User (1) ──generates──> (N) AuditEvent
Customer (1) ──has──> (N) Document
Customer (1) ──has──> (N) DeliveryNote
Document (1) ──has──> (N) DocumentItem
Document (1) ──has──> (N) DocumentVersion
Document (1) ──has──> (N) DeliveryNote
Document (1) ──convertedFrom──> (0..1) Document
DeliveryNote (1) ──has──> (N) DeliveryNoteItem
CompanySettings (1) ──has──> (N) Document
CompanySettings (1) ──has──> (N) DeliveryNote
```

### Entity-Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  CompanySettings │     │      User        │     │    Customer      │
│  (singleton)     │     │                  │     │                  │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ name             │     │ email (UNIQUE)   │     │ name             │
│ slogan           │     │ name             │     │ contactName      │
│ address          │     │ passwordHash     │     │ address          │
│ city             │     │ role (ENUM)      │     │ city             │
│ phone, phone2    │     │ status (ENUM)    │     │ phone            │
│ email            │     │ mustChangePass   │     │ email            │
│ rccm, ninea, ifu │     │ lastLoginAt      │     │ notes            │
│ bank, iban, etc  │     │ createdAt        │     │ createdAt        │
│ tvaDefault       │     │ updatedAt        │     │ updatedAt        │
│ tvaRate          │     └────────┬─────────┘     └────────┬─────────┘
│ currency         │              │                         │
│ logoUrl          │              │                         │
└────────┬─────────┘              │                         │
         │                        │                         │
         │    ┌───────────────────┼─────────────────────────┤
         │    │                   │                         │
         ▼    ▼                   ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Document      │     │   AuditEvent     │     │  DeliveryNote    │
│                  │     │                  │     │                  │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ type (ENUM)      │     │ action (ENUM)    │     │ num (UNIQUE)     │
│ num (UNIQUE)     │     │ entityType       │     │ date             │
│ date             │     │ entityId         │     │ status           │
│ status (ENUM)    │     │ entityNum        │     │ driverName       │
│ saleMode (ENUM)  │     │ userId (FK)──>User│     │ driverPhone      │
│ tvaOn, tvaRate   │     │ details (JSON)   │     │ orderRef         │
│ subtotal         │     │ ipAddress        │     │ customerId (FK)  │
│ tvaAmount        │     │ createdAt        │     │ documentId (FK)  │
│ total            │     └──────────────────┘     │ companyId (FK)   │
│ customerId (FK)  │                              │ createdBy (FK)   │
│ companyId (FK)   │     ┌──────────────────┐     │ snapshots...     │
│ createdBy (FK)   │     │DocumentSequence  │     │ createdAt        │
│ convertedFromId  │     ├──────────────────┤     │ updatedAt        │
│ snapshots...     │     │ id (PK)          │     └────────┬─────────┘
│ createdAt        │     │ type             │              │
│ updatedAt        │     │ year             │              │
└────────┬─────────┘     │ nextNumber       │              │
         │               └──────────────────┘              │
    ┌────┴────┐                                      ┌─────┴─────┐
    │         │                                      │           │
    ▼         ▼                                      ▼           ▼
┌──────────┐ ┌──────────────┐              ┌──────────────┐ ┌──────────────┐
│DocItem   │ │DocVersion    │              │DelNoteItem   │ │ RateLimit    │
├──────────┤ ├──────────────┤              ├──────────────┤ ├──────────────┤
│id (PK)   │ │id (PK)       │              │id (PK)       │ │id (PK)       │
│desig     │ │documentId(FK)│              │desig         │ │key (UNIQUE)  │
│quantity  │ │version       │              │quantity      │ │count         │
│unitPrice │ │snapshot(JSON)│              │observation   │ │resetAt       │
│total     │ │changedBy     │              │sortOrder     │ │createdAt     │
│sortOrder │ │changeSummary │              │deliveryNoteId│ └──────────────┘
│documentId│ │createdAt     │              │createdAt     │
│createdAt │ └──────────────┘              └──────────────┘
└──────────┘
```

### Indexes

| Table | Index | Purpose |
|---|---|---|
| `documents` | `type`, `status`, `date`, `num`, `customerId`, `companyId`, `createdBy`, `convertedFromId` | Query performance |
| `customers` | `name`, `phone` | Search performance |
| `delivery_notes` | `date`, `num`, `status`, `customerId`, `documentId`, `createdBy` | Query performance |
| `document_items` | `documentId` | Cascade queries |
| `delivery_note_items` | `deliveryNoteId` | Cascade queries |
| `document_versions` | `documentId`, `createdAt` | History queries |
| `audit_events` | `action`, `entityType+entityId`, `userId`, `createdAt` | Audit queries |
| `document_sequences` | `type+year` (UNIQUE) | Numbering integrity |

### Document Numbering

| Type | Format | Example |
|---|---|---|
| Proforma | `PF-YYYY-NNN` | `PF-2026-001` |
| Definitive | `FAC-YYYY-NNN` | `FAC-2026-001` |
| Delivery | `BL-YYYY-NNN` | `BL-2026-001` |

### Company Snapshots

When a document is created or updated, company and customer data is snapshotted into the document record. This ensures historical documents retain the information that was current at the time, even if company settings change later.

## Authentication

### Session Model

- HMAC-SHA256 signed tokens stored in HttpOnly cookies
- 8-hour session lifetime
- SameSite=Lax, Secure (in production)

### CSRF Protection

- Double-submit cookie pattern
- Random token stored in `csrf_token` cookie
- Same token sent in `x-csrf-token` header
- Validated via timing-safe comparison

## RBAC

See [RBAC_PERMISSION_MATRIX.md](./RBAC_PERMISSION_MATRIX.md) for the complete permission matrix.

### Enforcement Points

1. **Middleware**: Verifies session validity on all API routes
2. **Route handlers**: Check role-based permissions via `hasPermission()`
3. **Object-level**: Verify user owns the record being accessed via `canAccessDocument()` / `canAccessDeliveryNote()`

## Document Lifecycle

```
PROFORMA (DRAFT)
    ↓ finalize
PROFORMA (FINALIZED)
    ↓ convert
DEFINITIVE (DRAFT) ←── linked to source PROFORMA
    ↓ finalize
DEFINITIVE (FINALIZED)
    ↓ create BL
DELIVERY NOTE (DRAFT) ←── linked to source DOCUMENT
    ↓ confirm
DELIVERY NOTE (CONFIRMED)
```

## Security

### Server-Side Authorization

Every API endpoint enforces:
1. Authentication (session valid)
2. Role-based authorization (has required permission)
3. Object-level authorization (can access this specific record)

### Input Validation

All API inputs are validated with Zod schemas:
- String lengths enforced
- Email format validated
- Numeric ranges enforced
- Enums restricted to allowed values
- Required fields checked

### Output Protection

- Sensitive fields masked for unauthorized users
- Error messages sanitized (no internal details leaked)
- XSS protection via React's automatic escaping

## Deployment

### Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) | Yes |
| `SESSION_SECRET` | HMAC signing key (min 32 chars) | Yes |
| `NODE_ENV` | `development` or `production` | Yes |

### Vercel Configuration

- Framework: Next.js
- Build command: `next build`
- Output: `.next`
- Region: Frankfurt (EU)
