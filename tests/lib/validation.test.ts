import { describe, it, expect } from "vitest";
import {
  loginSchema,
  companySettingsSchema,
  documentCreateSchema,
  deliveryCreateSchema,
  userCreateSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "admin@ksy-global.com",
      password: "Admin@12345",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Admin@12345",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "admin@ksy-global.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("companySettingsSchema", () => {
  it("should accept valid settings", () => {
    const result = companySettingsSchema.safeParse({
      name: "KSY Global Service",
      city: "Dakar",
    });
    expect(result.success).toBe(true);
  });

  it("should reject name too long", () => {
    const result = companySettingsSchema.safeParse({
      name: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("should accept partial updates", () => {
    const result = companySettingsSchema.safeParse({
      city: "Dakar",
    });
    expect(result.success).toBe(true);
  });
});

describe("documentCreateSchema", () => {
  it("should accept valid document", () => {
    const result = documentCreateSchema.safeParse({
      type: "PROFORMA",
      items: [{ designation: "Item 1", quantity: 1, unitPrice: 1000 }],
    });
    expect(result.success).toBe(true);
  });

  it("should reject without items", () => {
    const result = documentCreateSchema.safeParse({
      type: "PROFORMA",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid type", () => {
    const result = documentCreateSchema.safeParse({
      type: "INVALID",
      items: [{ designation: "Item 1", quantity: 1, unitPrice: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it("should accept DEFINITIVE type", () => {
    const result = documentCreateSchema.safeParse({
      type: "DEFINITIVE",
      items: [{ designation: "Item 1", quantity: 1, unitPrice: 1000 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("deliveryCreateSchema", () => {
  it("should accept valid delivery note", () => {
    const result = deliveryCreateSchema.safeParse({
      items: [{ designation: "Item 1", quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it("should reject without items", () => {
    const result = deliveryCreateSchema.safeParse({
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("userCreateSchema", () => {
  it("should accept valid user data", () => {
    const result = userCreateSchema.safeParse({
      email: "user@test.com",
      name: "Test User",
      password: "password123",
      role: "SALES",
    });
    expect(result.success).toBe(true);
  });

  it("should reject short password", () => {
    const result = userCreateSchema.safeParse({
      email: "user@test.com",
      name: "Test User",
      password: "short",
      role: "SALES",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid role", () => {
    const result = userCreateSchema.safeParse({
      email: "user@test.com",
      name: "Test User",
      password: "password123",
      role: "SUPERADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("should accept DEVELOPER role", () => {
    const result = userCreateSchema.safeParse({
      email: "dev@test.com",
      name: "Dev",
      password: "password123",
      role: "DEVELOPER",
    });
    expect(result.success).toBe(true);
  });
});
