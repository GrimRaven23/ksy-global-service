import { describe, it, expect } from "vitest";
import {
  canEditDocument,
  canFinalizeDocument,
  canCancelDocument,
  canDeleteDocument,
  canEditDeliveryNote,
  canConfirmDeliveryNote,
} from "@/lib/authorization";

describe("Document Status Authorization", () => {
  describe("canEditDocument", () => {
    it("should allow editing DRAFT documents", () => {
      expect(canEditDocument("DRAFT")).toBe(true);
    });
    it("should reject editing EMISE documents", () => {
      expect(canEditDocument("EMISE")).toBe(false);
    });
    it("should reject editing FINALIZED documents", () => {
      expect(canEditDocument("FINALIZED")).toBe(false);
    });
    it("should reject editing CONVERTED documents", () => {
      expect(canEditDocument("CONVERTED")).toBe(false);
    });
    it("should reject editing CANCELLED documents", () => {
      expect(canEditDocument("CANCELLED")).toBe(false);
    });
  });

  describe("canFinalizeDocument", () => {
    it("should allow finalizing DRAFT documents", () => {
      expect(canFinalizeDocument("DRAFT")).toBe(true);
    });
    it("should allow finalizing EMISE documents", () => {
      expect(canFinalizeDocument("EMISE")).toBe(true);
    });
    it("should reject finalizing FINALIZED documents", () => {
      expect(canFinalizeDocument("FINALIZED")).toBe(false);
    });
    it("should reject finalizing CONVERTED documents", () => {
      expect(canFinalizeDocument("CONVERTED")).toBe(false);
    });
  });

  describe("canCancelDocument", () => {
    it("should allow cancelling DRAFT documents", () => {
      expect(canCancelDocument("DRAFT")).toBe(true);
    });
    it("should allow cancelling EMISE documents", () => {
      expect(canCancelDocument("EMISE")).toBe(true);
    });
    it("should allow cancelling FINALIZED documents", () => {
      expect(canCancelDocument("FINALIZED")).toBe(true);
    });
    it("should reject cancelling CANCELLED documents", () => {
      expect(canCancelDocument("CANCELLED")).toBe(false);
    });
    it("should reject cancelling CONVERTED documents", () => {
      expect(canCancelDocument("CONVERTED")).toBe(false);
    });
  });

  describe("canDeleteDocument", () => {
    it("should allow deleting DRAFT documents", () => {
      expect(canDeleteDocument("DRAFT")).toBe(true);
    });
    it("should allow deleting CANCELLED documents", () => {
      expect(canDeleteDocument("CANCELLED")).toBe(true);
    });
    it("should reject deleting EMISE documents", () => {
      expect(canDeleteDocument("EMISE")).toBe(false);
    });
    it("should reject deleting FINALIZED documents", () => {
      expect(canDeleteDocument("FINALIZED")).toBe(false);
    });
    it("should reject deleting CONVERTED documents", () => {
      expect(canDeleteDocument("CONVERTED")).toBe(false);
    });
  });
});

describe("Delivery Note Status Authorization", () => {
  describe("canEditDeliveryNote", () => {
    it("should allow editing DRAFT delivery notes", () => {
      expect(canEditDeliveryNote("DRAFT")).toBe(true);
    });
    it("should reject editing EMISE delivery notes", () => {
      expect(canEditDeliveryNote("EMISE")).toBe(false);
    });
    it("should reject editing FINALIZED delivery notes", () => {
      expect(canEditDeliveryNote("FINALIZED")).toBe(false);
    });
  });

  describe("canConfirmDeliveryNote", () => {
    it("should allow confirming DRAFT delivery notes", () => {
      expect(canConfirmDeliveryNote("DRAFT")).toBe(true);
    });
    it("should allow confirming EMISE delivery notes", () => {
      expect(canConfirmDeliveryNote("EMISE")).toBe(true);
    });
    it("should reject confirming FINALIZED delivery notes", () => {
      expect(canConfirmDeliveryNote("FINALIZED")).toBe(false);
    });
  });
});
