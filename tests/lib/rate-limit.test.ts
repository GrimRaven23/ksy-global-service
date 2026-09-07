import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  it("should allow requests within limit", () => {
    const result = checkRateLimit("test1", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block requests over limit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test2", 5, 60000);
    }
    const result = checkRateLimit("test2", 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("should track different keys independently", () => {
    checkRateLimit("keyA", 2, 60000);
    checkRateLimit("keyA", 2, 60000);
    const blocked = checkRateLimit("keyA", 2, 60000);
    expect(blocked.allowed).toBe(false);

    const stillAllowed = checkRateLimit("keyB", 2, 60000);
    expect(stillAllowed.allowed).toBe(true);
  });
});
