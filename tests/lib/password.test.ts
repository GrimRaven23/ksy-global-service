import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";

describe("Password Hashing", () => {
  it("should hash a password", () => {
    const hash = hashPassword("test123");
    expect(hash).toContain(":");
    const [salt, hex] = hash.split(":");
    expect(salt).toHaveLength(32); // 16 bytes hex
    expect(hex).toHaveLength(128); // 64 bytes hex
  });

  it("should verify a correct password", () => {
    const hash = hashPassword("Admin@12345");
    expect(verifyPassword("Admin@12345", hash)).toBe(true);
  });

  it("should reject an incorrect password", () => {
    const hash = hashPassword("Admin@12345");
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("should reject empty password", () => {
    const hash = hashPassword("test");
    expect(verifyPassword("", hash)).toBe(false);
  });

  it("should reject malformed stored hash", () => {
    expect(verifyPassword("test", "no-colon")).toBe(false);
    expect(verifyPassword("test", "")).toBe(false);
  });

  it("should generate different salts for each call", () => {
    const hash1 = hashPassword("same");
    const hash2 = hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });
});
