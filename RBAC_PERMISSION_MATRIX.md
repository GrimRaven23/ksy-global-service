# RBAC Permission Matrix — KSY Global Service

## Role Hierarchy

```
OWNER (100) > IT_ADMIN (90) > ADMIN (80) > ACCOUNTANT (75) > SALES (60) > PROJECT_MANAGER (55) > ASSISTANT (50) > COMPLIANCE (45) > DELIVERY (40) > WAREHOUSE (35) > VIEWER (10)
```

## Permission Matrix

### Documents

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `documents.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `documents.create` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `documents.update` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `documents.finalize` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `documents.cancel` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `documents.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `documents.print` | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Proforma

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `proforma.create` | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `proforma.convert` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Customers

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `customers.read` | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `customers.create` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `customers.update` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `customers.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Company

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `company.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `company.read_sensitive` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `company.update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Delivery

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `delivery.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `delivery.create` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `delivery.update` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `delivery.confirm` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `delivery.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `delivery.print` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

### Users & Access

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `users.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.disable` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `roles.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### System

| Permission | OWNER | IT_ADMIN | ADMIN | ACCOUNTANT | SALES | PROJECT_MANAGER | ASSISTANT | COMPLIANCE | DELIVERY | WAREHOUSE | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `audit.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `security.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `system.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `reports.view` | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `inventory.read` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `inventory.update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## Role Descriptions

| Role | Description |
|---|---|
| **OWNER** | Highest business authority. Full access to all features, settings, users, and audit. |
| **IT_ADMIN** | Technical operations. User management, security monitoring, system health. Limited business data access. |
| **ADMIN** | Operational administration. Document management, customer management, delivery oversight. |
| **ACCOUNTANT** | Financial read access. Can view documents, print invoices, view company sensitive data. |
| **SALES** | Create and manage proforma/definitive invoices. Manage customers. Print documents. |
| **PROJECT_MANAGER** | Delivery management. Create/update/confirm delivery notes. View reports. |
| **ASSISTANT** | Prepare drafts. Assist with customers. Limited finalization access. |
| **COMPLIANCE** | Read-only audit and compliance access. View documents, customers, audit events. |
| **DELIVERY** | View and update delivery notes. Print BL. Access delivery-related customer data. |
| **WAREHOUSE** | Inventory read/update. View documents and delivery notes. |
| **VIEWER** | Read-only access to documents, customers, company settings, and delivery notes. |

## Security Rules

1. **Server-side enforcement**: All permissions are checked on the API routes, not just in the UI.
2. **Object-level authorization**: Users can only access records they own (unless they have admin-level roles).
3. **Self-edit restriction**: Users cannot change their own role or status.
4. **Last owner protection**: The last active OWNER cannot be disabled or deleted.
5. **Role escalation prevention**: Users cannot assign roles higher than their own hierarchy level.
