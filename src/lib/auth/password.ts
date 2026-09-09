import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `${salt}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), verify);
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
