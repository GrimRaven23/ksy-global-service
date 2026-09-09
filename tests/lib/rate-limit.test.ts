import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimit: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindUnique = vi.mocked(prisma.rateLimit.findUnique);
const mockUpsert = vi.mocked(prisma.rateLimit.upsert);
const mockUpdate = vi.mocked(prisma.rateLimit.update);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Rate Limiter", () => {
  it("should allow first request", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({} as any);

    const result = await checkRateLimit("test1", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("should block requests over limit", async () => {
    mockFindUnique.mockResolvedValue({
      id: "1",
      key: "test2",
      count: 5,
      resetAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
    });
    mockUpdate.mockResolvedValue({} as any);

    const result = await checkRateLimit("test2", 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("should increment count for existing window", async () => {
    mockFindUnique.mockResolvedValue({
      id: "1",
      key: "test3",
      count: 2,
      resetAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
    });
    mockUpdate.mockResolvedValue({} as any);

    const result = await checkRateLimit("test3", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should reset when window expired", async () => {
    mockFindUnique.mockResolvedValue({
      id: "1",
      key: "test4",
      count: 5,
      resetAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    });
    mockUpsert.mockResolvedValue({} as any);

    const result = await checkRateLimit("test4", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(mockUpsert).toHaveBeenCalled();
  });
});
