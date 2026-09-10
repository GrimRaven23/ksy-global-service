import { describe, it, expect } from "vitest";
import { statusLabel, statusColor, roleLabel } from "@/lib/document-helpers";

describe("finalized status canonical (EMISE)", () => {
  it("labels legacy FINALIZED like EMISE", () => {
    expect(statusLabel("EMISE")).toBe("Finalisée");
    expect(statusLabel("FINALIZED")).toBe("Finalisée");
  });

  it("colors legacy FINALIZED like EMISE", () => {
    expect(statusColor("EMISE")).toBe(statusColor("FINALIZED"));
  });
});

describe("role labels", () => {
  it("labels DEVELOPER", () => {
    expect(roleLabel("DEVELOPER")).toBe("Développeur");
  });
});
