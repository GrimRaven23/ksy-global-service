import { describe, it, expect, vi } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  isAppError,
  getStatusCode,
  getErrorMessage,
} from "@/lib/errors";

describe("AppError", () => {
  it("should create an error with status code", () => {
    const error = new AppError("Test error", 400, "TEST_ERROR");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.name).toBe("AppError");
  });

  it("should default to 500 status", () => {
    const error = new AppError("Internal");
    expect(error.statusCode).toBe(500);
  });
});

describe("NotFoundError", () => {
  it("should have 404 status", () => {
    const error = new NotFoundError("User");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("User not found");
    expect(error.code).toBe("NOT_FOUND");
  });
});

describe("UnauthorizedError", () => {
  it("should have 401 status", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });
});

describe("ForbiddenError", () => {
  it("should have 403 status", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });
});

describe("ConflictError", () => {
  it("should have 409 status", () => {
    const error = new ConflictError("Already exists");
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe("Already exists");
  });
});

describe("isAppError", () => {
  it("should return true for AppError instances", () => {
    expect(isAppError(new AppError("test"))).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
  });

  it("should return false for regular errors", () => {
    expect(isAppError(new Error("test"))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError("string")).toBe(false);
  });
});

describe("getStatusCode", () => {
  it("should return status from AppError", () => {
    expect(getStatusCode(new AppError("test", 418))).toBe(418);
    expect(getStatusCode(new NotFoundError())).toBe(404);
  });

  it("should return 500 for unknown errors", () => {
    expect(getStatusCode(new Error("test"))).toBe(500);
    expect(getStatusCode(null)).toBe(500);
  });
});

describe("getErrorMessage", () => {
  it("should return message from AppError", () => {
    expect(getErrorMessage(new AppError("Custom error"))).toBe("Custom error");
  });

  it("should return generic message in production for regular errors", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getErrorMessage(new Error("secret"))).toBe("Erreur serveur");
    vi.unstubAllEnvs();
  });

  it("should return original message in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getErrorMessage(new Error("dev error"))).toBe("dev error");
    vi.unstubAllEnvs();
  });
});
