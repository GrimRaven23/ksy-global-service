import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// COMPANY SETTINGS
// ═══════════════════════════════════════════════════════════════

export const companySettingsSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slogan: z.string().max(200).optional(),
  activite: z.string().max(500).optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  phone2: z.string().max(30).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  web: z.string().url().max(200).nullable().optional(),
  rccm: z.string().max(50).nullable().optional(),
  ninea: z.string().max(50).nullable().optional(),
  ifu: z.string().max(50).nullable().optional(),
  bank: z.string().max(200).nullable().optional(),
  bkName: z.string().max(200).nullable().optional(),
  iban: z.string().max(50).nullable().optional(),
  swift: z.string().max(20).nullable().optional(),
  compte: z.string().max(50).nullable().optional(),
  tvaDefault: z.enum(["oui", "non"]).optional(),
  tvaRate: z.number().min(0).max(100).optional(),
  currency: z.string().max(10).optional(),
  logoUrl: z.string().url().max(500).nullable().optional(),
  cachetUrl: z.string().url().max(500).nullable().optional(),
});

// ═══════════════════════════════════════════════════════════════
// CUSTOMER
// ═══════════════════════════════════════════════════════════════

export const customerSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ═══════════════════════════════════════════════════════════════
// DOCUMENT ITEMS
// ═══════════════════════════════════════════════════════════════

const documentItemSchema = z.object({
  id: z.string().optional(),
  designation: z.string().min(1).max(500),
  quantity: z.number().min(0).max(999999),
  unitPrice: z.number().min(0).max(999999999),
});

const deliveryItemSchema = z.object({
  id: z.string().optional(),
  designation: z.string().min(1).max(500),
  quantity: z.number().min(0).max(999999),
  observation: z.string().max(500).optional().default(""),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ═══════════════════════════════════════════════════════════════
// DOCUMENT (PRO FORMA / DEFINITIVE)
// ═══════════════════════════════════════════════════════════════

export const documentCreateSchema = z.object({
  type: z.enum(["PROFORMA", "DEFINITIVE"]),
  date: z.string().optional(),
  validity: z.string().nullable().optional(),
  ref: z.string().max(100).nullable().optional(),
  saleMode: z.enum(["DIRECTE", "LIVRAISON"]).optional(),
  tvaOn: z.boolean().optional(),
  tvaRate: z.number().min(0).max(100).optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().max(200).optional(),
  customerAddr: z.string().max(500).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().max(200).optional(),
  items: z.array(documentItemSchema).min(1),
});

export const documentUpdateSchema = z.object({
  date: z.string().optional(),
  validity: z.string().nullable().optional(),
  ref: z.string().max(100).nullable().optional(),
  saleMode: z.enum(["DIRECTE", "LIVRAISON"]).optional(),
  status: z.enum(["DRAFT", "FINALIZED", "CANCELLED"]).optional(),
  tvaOn: z.boolean().optional(),
  tvaRate: z.number().min(0).max(100).optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().max(200).optional(),
  customerAddr: z.string().max(500).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().max(200).optional(),
  items: z.array(documentItemSchema).min(1).optional(),
});

// ═══════════════════════════════════════════════════════════════
// DELIVERY NOTE
// ═══════════════════════════════════════════════════════════════

export const deliveryCreateSchema = z.object({
  date: z.string().optional(),
  observations: z.string().max(2000).optional(),
  driverName: z.string().max(200).optional(),
  driverPhone: z.string().max(30).optional(),
  orderRef: z.string().max(100).optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().max(200).optional(),
  customerAddr: z.string().max(500).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().max(200).optional(),
  documentId: z.string().nullable().optional(),
  items: z.array(deliveryItemSchema).min(1),
});

export const deliveryUpdateSchema = z.object({
  date: z.string().optional(),
  observations: z.string().max(2000).optional(),
  driverName: z.string().max(200).optional(),
  driverPhone: z.string().max(30).optional(),
  orderRef: z.string().max(100).optional(),
  status: z.enum(["DRAFT", "FINALIZED", "CANCELLED"]).optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().max(200).optional(),
  customerAddr: z.string().max(500).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().max(200).optional(),
  items: z.array(deliveryItemSchema).min(1).optional(),
});

// ═══════════════════════════════════════════════════════════════
// USER / AUTH
// ═══════════════════════════════════════════════════════════════

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8).max(200),
  role: z.enum(["OWNER", "IT_ADMIN", "ADMIN", "SALES", "ASSISTANT", "DELIVERY", "VIEWER"]),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(["OWNER", "IT_ADMIN", "ADMIN", "SALES", "ASSISTANT", "DELIVERY", "VIEWER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

// ═══════════════════════════════════════════════════════════════
// CREATE BL FROM DOCUMENT
// ═══════════════════════════════════════════════════════════════

export const createBLFromDocSchema = z.object({
  documentId: z.string().min(1),
});
