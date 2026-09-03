import { Decimal } from "@prisma/client/runtime/library";

// ═══════════════════════════════════════════════════════════════
// DOCUMENT TYPES
// ═══════════════════════════════════════════════════════════════

export type DocType = "PROFORMA" | "DEFINITIVE";
export type DeliveryType = "DELIVERY_NOTE";
export type SaleMode = "DIRECTE" | "LIVRAISON";
export type DocStatus = "DRAFT" | "FINALIZED" | "CANCELLED";

// ═══════════════════════════════════════════════════════════════
// COMPANY
// ═══════════════════════════════════════════════════════════════

export interface CompanyData {
  id: string;
  name: string;
  slogan: string;
  activite: string;
  address: string;
  city: string;
  phone: string;
  phone2: string;
  email: string;
  web: string;
  rccm: string;
  ninea: string;
  ifu: string;
  bank: string;
  bkName: string;
  iban: string;
  swift: string;
  compte: string;
  tvaDefault: string;
  tvaRate: number;
  currency: string;
  logoUrl: string;
  cachetUrl: string;
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMER
// ═══════════════════════════════════════════════════════════════

export interface CustomerData {
  id: string;
  name: string;
  contactName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  notes: string;
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT ITEMS
// ═══════════════════════════════════════════════════════════════

export interface DocumentItemData {
  designation: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryItemData {
  designation: string;
  quantity: number;
  observation: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPANY SNAPSHOT (stored on documents for historical integrity)
// ═══════════════════════════════════════════════════════════════

export interface CompanySnapshot {
  companyName: string;
  companyAddr: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;
  companyRccm: string;
  companyNinea: string;
  companyIfu: string;
  companyBank: string;
  companyBkName: string;
  companyIban: string;
  companySwift: string;
  companyCompte: string;
}

export interface CustomerSnapshot {
  customerName: string;
  customerAddr: string;
  customerPhone: string;
  customerEmail: string;
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT DATA (normalized single source of truth)
// ═══════════════════════════════════════════════════════════════

export interface InvoiceDocument {
  id: string;
  type: DocType;
  num: string;
  date: string;
  validity: string;
  ref: string;
  saleMode: SaleMode;
  status: DocStatus;
  tvaOn: boolean;
  tvaRate: number;

  customerId: string;
  customerName: string;
  customerAddr: string;
  customerPhone: string;
  customerEmail: string;

  items: InvoiceItem[];
  subtotal: number;
  tvaAmount: number;
  total: number;
  wordsValue: string;

  company: CompanySnapshot;
}

export interface InvoiceItem {
  id?: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DeliveryDocument {
  id: string;
  type: DeliveryType;
  num: string;
  date: string;
  observations: string;
  status: DocStatus;

  driverName: string;
  driverPhone: string;
  orderRef: string;

  customerId: string;
  customerName: string;
  customerAddr: string;
  customerPhone: string;
  customerEmail: string;

  documentId: string;

  items: DeliveryItem[];
  company: CompanySnapshot;
}

export interface DeliveryItem {
  id?: string;
  designation: string;
  quantity: number;
  observation: string;
  sortOrder: number;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// RBAC TYPES
// ═══════════════════════════════════════════════════════════════

export type Permission =
  | "documents.read"
  | "documents.create"
  | "documents.update"
  | "documents.finalize"
  | "documents.delete"
  | "documents.print"
  | "customers.read"
  | "customers.create"
  | "customers.update"
  | "customers.delete"
  | "company.read"
  | "company.update"
  | "delivery.read"
  | "delivery.create"
  | "delivery.update"
  | "delivery.delete"
  | "delivery.print"
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.disable"
  | "roles.manage"
  | "audit.read"
  | "security.manage"
  | "system.manage";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    "documents.read", "documents.create", "documents.update", "documents.finalize", "documents.delete", "documents.print",
    "customers.read", "customers.create", "customers.update", "customers.delete",
    "company.read", "company.update",
    "delivery.read", "delivery.create", "delivery.update", "delivery.delete", "delivery.print",
    "users.read", "users.create", "users.update", "users.disable",
    "roles.manage",
    "audit.read",
    "security.manage",
    "system.manage",
  ],
  IT_ADMIN: [
    "documents.read", "documents.print",
    "customers.read",
    "company.read", "company.update",
    "delivery.read", "delivery.print",
    "users.read", "users.create", "users.update", "users.disable",
    "audit.read",
    "security.manage",
    "system.manage",
  ],
  ADMIN: [
    "documents.read", "documents.create", "documents.update", "documents.finalize", "documents.print",
    "customers.read", "customers.create", "customers.update",
    "company.read",
    "delivery.read", "delivery.create", "delivery.update", "delivery.print",
    "users.read",
    "audit.read",
  ],
  SALES: [
    "documents.read", "documents.create", "documents.update", "documents.print",
    "customers.read", "customers.create", "customers.update",
    "delivery.read", "delivery.print",
  ],
  ASSISTANT: [
    "documents.read", "documents.create", "documents.update",
    "customers.read", "customers.create", "customers.update",
    "delivery.read",
  ],
  DELIVERY: [
    "documents.read",
    "customers.read",
    "delivery.read", "delivery.update", "delivery.print",
  ],
  VIEWER: [
    "documents.read",
    "customers.read",
    "company.read",
    "delivery.read",
  ],
};

// ═══════════════════════════════════════════════════════════════
// SESSION TYPES
// ═══════════════════════════════════════════════════════════════

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
