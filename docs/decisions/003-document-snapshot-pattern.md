# ADR-003: Document Snapshot Pattern for Historical Integrity

## Status
Accepted

## Context
Commercial invoices (Facture Pro Forma, Facture Définitive, Bon de Livraison) are legal documents in Senegalese business context. They must remain accurate even if the underlying customer or company data changes after creation.

## Decision
We snapshot both company and customer data **at document creation/update time**, storing denormalized copies directly on the Document record:

- **Company snapshot** (12 fields): `companyName`, `companyAddr`, `companyCity`, `companyPhone`, `companyEmail`, `companyRccm`, `companyNinea`, `companyIfu`, `companyBank`, `companyBkName`, `companyIban`, `companySwift`, `companyCompte`
- **Customer snapshot** (4 fields): `customerName`, `customerAddr`, `customerPhone`, `customerEmail`
- **Optional FK**: `customerId` links to the Customer record for lookup/reuse, but the snapshot fields are the source of truth for display

The editor loads snapshot fields first, falling back to the related customer record:
```typescript
clientName: existing.customerName || existing.customer?.name || ""
```

On save, the backend re-snapshots company data from `CompanySettings`:
```typescript
if (existing.status === "DRAFT") {
  Object.assign(updateData, snapshotCompany(company));
}
```

## Consequences
- **Positive**: Documents are immutable snapshots; editing a customer never changes historical invoices; print output is always consistent
- **Negative**: Data redundancy; editing customer details requires updating both the Customer record and all linked documents if consistency is desired (we chose not to auto-propagate)
- **Mitigation**: Documents in DRAFT status get re-snapshotted on every save; finalized documents are locked and never re-snapshotted
