import crypto from "crypto";
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  needsRehash,
} from "@/lib/auth/password";

function legacyHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  return `${salt}:${hash.toString("hex")}`;
}

describe("Password Hashing", () => {
  it("should hash a password in versioned format", () => {
    const hash = hashPassword("test123");
    expect(hash.startsWith("pbkdf2$")).toBe(true);
    const parts = hash.split("$");
    expect(parts).toHaveLength(4);
    expect(parts[2]).toHaveLength(32); // 16 bytes hex salt
    expect(parts[3]).toHaveLength(128); // 64 bytes hex
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
    expect(verifyPassword("test", "pbkdf2$bad")).toBe(false);
    expect(verifyPassword("test", "pbkdf2$0$$")).toBe(false);
  });

  it("should generate different salts for each call", () => {
    const hash1 = hashPassword("same");
    const hash2 = hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });

  it("should still verify legacy hashes and flag them for rehash", () => {
    const legacy = legacyHash("Admin@12345");
    expect(verifyPassword("Admin@12345", legacy)).toBe(true);
    expect(verifyPassword("WrongPassword", legacy)).toBe(false);
    expect(needsRehash(legacy)).toBe(true);
  });

  it("should not flag current hashes for rehash", () => {
    expect(needsRehash(hashPassword("Admin@12345"))).toBe(false);
  });
});
