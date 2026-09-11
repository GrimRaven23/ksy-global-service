import crypto from "crypto";

// OWASP 2023+: 210k minimum for PBKDF2-HMAC-SHA512. We use 310k.
// Format: `pbkdf2$<iterations>$<saltHex>$<hashHex>`.
// Legacy format `salt:hash` (100k) is still verified and transparently
// upgraded on next successful login (see needsRehash).
const ITERATIONS = 310000;
const LEGACY_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `pbkdf2$${ITERATIONS}$${salt}$${hash.toString("hex")}`;
}

export function needsRehash(stored: string): boolean {
  return !stored.startsWith("pbkdf2$");
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("pbkdf2$")) {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1] || "", 10);
    const salt = parts[2] || "";
    const expected = parts[3] || "";
    if (!Number.isInteger(iterations) || iterations <= 0 || !salt || !expected) return false;
    try {
      const verify = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
      return safeEqual(Buffer.from(expected, "hex"), verify);
    } catch {
      return false;
    }
  }
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const verify = crypto.pbkdf2Sync(password, salt, LEGACY_ITERATIONS, KEY_LENGTH, DIGEST);
    return safeEqual(Buffer.from(hash, "hex"), verify);
  } catch {
    return false;
  }
}

export function generateRandomPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);

  let pass = "";
  pass += upper[arr[0] % upper.length];
  pass += lower[arr[1] % lower.length];
  pass += digits[arr[2] % digits.length];
  for (let i = 3; i < 16; i++) {
    pass += all[arr[i] % all.length];
  }
  return pass;
}
