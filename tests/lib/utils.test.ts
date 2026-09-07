import { describe, it, expect } from "vitest";
import { fmtDate, fmtNum, esc, padN, curYear, numToWordsFCFA, calcInvoice } from "@/lib/utils";

describe("fmtDate", () => {
  it("should format a date string to dd/mm/yyyy", () => {
    expect(fmtDate("2024-03-15")).toBe("15/03/2024");
  });

  it("should format a Date object", () => {
    expect(fmtDate(new Date(2024, 0, 1))).toBe("01/01/2024");
  });

  it("should handle ISO datetime strings", () => {
    expect(fmtDate("2024-12-25T10:30:00Z")).toContain("25/12/2024");
  });
});

describe("fmtNum", () => {
  it("should format numbers with spaces", () => {
    expect(fmtNum(1000)).toBe("1 000");
    expect(fmtNum(1000000)).toBe("1 000 000");
  });

  it("should handle zero", () => {
    expect(fmtNum(0)).toBe("0");
  });

  it("should handle decimals by rounding", () => {
    const result = fmtNum(1234.56);
    expect(result).toBe("1 235");
  });
});

describe("esc", () => {
  it("should escape HTML entities", () => {
    expect(esc('<script>alert("xss")</script>')).toContain("&lt;");
    expect(esc('<script>alert("xss")</script>')).toContain("&gt;");
  });

  it("should escape ampersand", () => {
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("should handle normal text", () => {
    expect(esc("hello world")).toBe("hello world");
  });
});

describe("padN", () => {
  it("should pad single digits to 2 chars", () => {
    expect(padN(1)).toBe("01");
    expect(padN(42)).toBe("42");
  });
});

describe("curYear", () => {
  it("should return the current year", () => {
    expect(curYear()).toBe(new Date().getFullYear());
  });
});

describe("numToWordsFCFA", () => {
  it("should convert zero", () => {
    const result = numToWordsFCFA(0);
    expect(result).toContain("zéro");
  });

  it("should convert small amounts", () => {
    const result = numToWordsFCFA(1000);
    expect(result).toContain("mille");
  });

  it("should convert large amounts", () => {
    const result = numToWordsFCFA(1000000);
    expect(result).toContain("million");
  });

  it("should append FCFA", () => {
    const result = numToWordsFCFA(500);
    expect(result).toContain("FCFA");
  });
});

describe("calcInvoice", () => {
  it("should calculate subtotal without TVA", () => {
    const items = [
      { designation: "Item 1", quantity: 10, unitPrice: 1000 },
      { designation: "Item 2", quantity: 5, unitPrice: 2000 },
    ];
    const result = calcInvoice(items, false, 18);
    expect(result.subtotal).toBe(20000);
    expect(result.tva).toBe(0);
    expect(result.total).toBe(20000);
  });

  it("should calculate subtotal with TVA", () => {
    const items = [
      { designation: "Item 1", quantity: 10, unitPrice: 1000 },
    ];
    const result = calcInvoice(items, true, 18);
    expect(result.subtotal).toBe(10000);
    expect(result.tva).toBe(1800);
    expect(result.total).toBe(11800);
  });

  it("should handle empty items", () => {
    const result = calcInvoice([], false, 18);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });
});
