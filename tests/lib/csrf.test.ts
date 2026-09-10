import { describe, it, expect } from "vitest";
import { validateCsrf } from "@/lib/csrf";

function req(method: string, headerToken?: string): Request {
  const headers = new Headers();
  if (headerToken !== undefined) headers.set("x-csrf-token", headerToken);
  return new Request("http://localhost/api/documents", { method, headers });
}

function cookies(cookieToken?: string) {
  return { get: (name: string) => (name === "csrf_token" && cookieToken !== undefined ? { value: cookieToken } : undefined) };
}

describe("validateCsrf", () => {
  it("allows safe methods without tokens", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(validateCsrf(req(method), cookies())).toBe(true);
    }
  });

  it("accepts matching cookie + header on mutations", () => {
    expect(validateCsrf(req("POST", "abc123"), cookies("abc123"))).toBe(true);
    expect(validateCsrf(req("PUT", "tok"), cookies("tok"))).toBe(true);
    expect(validateCsrf(req("DELETE", "tok"), cookies("tok"))).toBe(true);
  });

  it("rejects missing cookie", () => {
    expect(validateCsrf(req("POST", "tok"), cookies())).toBe(false);
  });

  it("rejects missing header", () => {
    expect(validateCsrf(req("POST"), cookies("tok"))).toBe(false);
  });

  it("rejects mismatched tokens (forged request)", () => {
    expect(validateCsrf(req("POST", "evil"), cookies("real"))).toBe(false);
  });

  it("rejects wrong-session token of different length", () => {
    expect(validateCsrf(req("POST", "short"), cookies("much-longer-token"))).toBe(false);
  });
});
