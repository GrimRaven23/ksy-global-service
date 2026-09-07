import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS } from "@/lib/types";

describe("RBAC Permissions", () => {
  describe("OWNER role", () => {
    it("should have all permissions", () => {
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
      expect(ownerPerms.length).toBe(25);
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

  describe("All roles have valid permission arrays", () => {
    const validRoles = ["OWNER", "IT_ADMIN", "ADMIN", "SALES", "ASSISTANT", "DELIVERY", "VIEWER"];

    it.each(validRoles)("%s role should exist and be non-empty", (role) => {
      const perms = ROLE_PERMISSIONS[role];
      expect(perms).toBeDefined();
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    });
  });
});
