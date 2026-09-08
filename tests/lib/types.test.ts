import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, ROLE_HIERARCHY } from "@/lib/types";

describe("RBAC Permissions", () => {
  describe("OWNER role", () => {
    it("should have all permissions including sensitive data access", () => {
      const ownerPerms = ROLE_PERMISSIONS["OWNER"];
      expect(ownerPerms).toContain("documents.read");
      expect(ownerPerms).toContain("documents.create");
      expect(ownerPerms).toContain("documents.delete");
      expect(ownerPerms).toContain("users.read");
      expect(ownerPerms).toContain("users.create");
      expect(ownerPerms).toContain("users.disable");
      expect(ownerPerms).toContain("roles.manage");
      expect(ownerPerms).toContain("audit.read");
      expect(ownerPerms).toContain("system.manage");
      expect(ownerPerms).toContain("company.read_sensitive");
      expect(ownerPerms.length).toBe(33);
    });
  });

  describe("IT_ADMIN role", () => {
    it("should have maintenance/monitoring permissions only", () => {
      const itAdminPerms = ROLE_PERMISSIONS["IT_ADMIN"];
      expect(itAdminPerms).toContain("company.read");
      expect(itAdminPerms).toContain("company.read_sensitive");
      expect(itAdminPerms).toContain("users.read");
      expect(itAdminPerms).toContain("users.create");
      expect(itAdminPerms).toContain("users.update");
      expect(itAdminPerms).toContain("users.disable");
      expect(itAdminPerms).toContain("audit.read");
      expect(itAdminPerms).toContain("security.manage");
      expect(itAdminPerms).toContain("system.manage");
    });

    it("should NOT have access to sensitive business data", () => {
      const itAdminPerms = ROLE_PERMISSIONS["IT_ADMIN"];
      expect(itAdminPerms).toContain("documents.read");
      expect(itAdminPerms).not.toContain("documents.create");
      expect(itAdminPerms).not.toContain("documents.delete");
      expect(itAdminPerms).not.toContain("customers.read");
      expect(itAdminPerms).not.toContain("customers.create");
      expect(itAdminPerms).not.toContain("company.update");
      expect(itAdminPerms).toContain("delivery.read");
      expect(itAdminPerms).not.toContain("delivery.create");
      expect(itAdminPerms).not.toContain("roles.manage");
    });
  });

  describe("SALES role", () => {
    it("should have document and customer permissions", () => {
      const salesPerms = ROLE_PERMISSIONS["SALES"];
      expect(salesPerms).toContain("documents.read");
      expect(salesPerms).toContain("documents.create");
      expect(salesPerms).toContain("customers.read");
      expect(salesPerms).toContain("customers.create");
    });

    it("should NOT have user management permissions", () => {
      const salesPerms = ROLE_PERMISSIONS["SALES"];
      expect(salesPerms).not.toContain("users.read");
      expect(salesPerms).not.toContain("users.create");
      expect(salesPerms).not.toContain("audit.read");
      expect(salesPerms).not.toContain("system.manage");
    });
  });

  describe("VIEWER role", () => {
    it("should only have read permissions", () => {
      const viewerPerms = ROLE_PERMISSIONS["VIEWER"];
      expect(viewerPerms).toContain("documents.read");
      expect(viewerPerms).toContain("customers.read");
      expect(viewerPerms).toContain("company.read");
      expect(viewerPerms).toContain("delivery.read");

      expect(viewerPerms).not.toContain("documents.create");
      expect(viewerPerms).not.toContain("documents.update");
      expect(viewerPerms).not.toContain("documents.delete");
      expect(viewerPerms).not.toContain("users.read");
    });
  });

  describe("DELIVERY role", () => {
    it("should have delivery and read permissions", () => {
      const deliveryPerms = ROLE_PERMISSIONS["DELIVERY"];
      expect(deliveryPerms).toContain("documents.read");
      expect(deliveryPerms).toContain("customers.read");
      expect(deliveryPerms).toContain("delivery.read");
      expect(deliveryPerms).toContain("delivery.update");
      expect(deliveryPerms).toContain("delivery.print");
    });

    it("should NOT have document create/delete", () => {
      const deliveryPerms = ROLE_PERMISSIONS["DELIVERY"];
      expect(deliveryPerms).not.toContain("documents.create");
      expect(deliveryPerms).not.toContain("documents.delete");
    });
  });

  describe("Role hierarchy", () => {
    it("should enforce correct hierarchy ordering", () => {
      expect(ROLE_HIERARCHY["OWNER"]).toBeGreaterThan(ROLE_HIERARCHY["IT_ADMIN"]);
      expect(ROLE_HIERARCHY["IT_ADMIN"]).toBeGreaterThan(ROLE_HIERARCHY["ADMIN"]);
      expect(ROLE_HIERARCHY["ADMIN"]).toBeGreaterThan(ROLE_HIERARCHY["SALES"]);
      expect(ROLE_HIERARCHY["SALES"]).toBeGreaterThan(ROLE_HIERARCHY["ASSISTANT"]);
      expect(ROLE_HIERARCHY["ASSISTANT"]).toBeGreaterThan(ROLE_HIERARCHY["DELIVERY"]);
      expect(ROLE_HIERARCHY["DELIVERY"]).toBeGreaterThan(ROLE_HIERARCHY["VIEWER"]);
    });

    it("should have all roles in hierarchy", () => {
      const validRoles = ["OWNER", "IT_ADMIN", "ADMIN", "ACCOUNTANT", "SALES", "PROJECT_MANAGER", "ASSISTANT", "COMPLIANCE", "DELIVERY", "WAREHOUSE", "VIEWER"];
      for (const role of validRoles) {
        expect(ROLE_HIERARCHY[role]).toBeDefined();
        expect(typeof ROLE_HIERARCHY[role]).toBe("number");
      }
    });
  });

  describe("All roles have valid permission arrays", () => {
    const validRoles = ["OWNER", "IT_ADMIN", "ADMIN", "ACCOUNTANT", "SALES", "PROJECT_MANAGER", "ASSISTANT", "COMPLIANCE", "DELIVERY", "WAREHOUSE", "VIEWER"];

    it.each(validRoles)("%s role should exist and be non-empty", (role) => {
      const perms = ROLE_PERMISSIONS[role];
      expect(perms).toBeDefined();
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    });
  });
});
