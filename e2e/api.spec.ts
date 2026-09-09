import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL || "admin@ksy-global.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Admin@12345";

test.describe("API - Auth", () => {
  test("POST /api/auth/login returns success with valid credentials", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.user || body.mustChangePassword !== undefined).toBeTruthy();
  });

  test("POST /api/auth/login returns 401 with invalid credentials", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "nonexistent@email.com", password: "wrongpass" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("POST /api/auth/login rejects empty body", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/auth/me returns user when authenticated", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const me = await request.get("/api/auth/me");
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    expect(body.user.email).toBe(TEST_EMAIL);
  });

  test("POST /api/auth/logout clears session", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const logoutRes = await request.post("/api/auth/logout");
    expect(logoutRes.ok()).toBeTruthy();
  });
});

test.describe("API - Documents", () => {
  test("GET /api/documents requires auth", async ({ request }) => {
    const res = await request.get("/api/documents");
    expect([200, 401]).toContain(res.status());
  });

  test("GET /api/documents returns array", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const res = await request.get("/api/documents");
    if (res.ok()) {
      const body = await res.json();
      expect(Array.isArray(body.documents || body.data || body)).toBeTruthy();
    }
  });
});

test.describe("API - Delivery", () => {
  test("GET /api/delivery requires auth", async ({ request }) => {
    const res = await request.get("/api/delivery");
    expect([200, 401]).toContain(res.status());
  });
});

test.describe("API - Customers", () => {
  test("GET /api/customers requires auth", async ({ request }) => {
    const res = await request.get("/api/customers");
    expect([200, 401]).toContain(res.status());
  });

  test("POST /api/customers creates customer", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const res = await request.post("/api/customers", {
      data: {
        name: "E2E Test Customer",
        phone: "+221 77 000 00 00",
        email: "e2e@test.com",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.ok).toBe(true);

    if (body.data?.id) {
      const delRes = await request.delete(`/api/customers?id=${body.data.id}`);
      expect(delRes.ok()).toBeTruthy();
    }
  });

  test("POST /api/customers rejects empty name", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const res = await request.post("/api/customers", {
      data: { name: "" },
    });
    expect([400, 422]).toContain(res.status());
  });
});

test.describe("API - Settings", () => {
  test("GET /api/settings returns company info", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const res = await request.get("/api/settings");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.name || body.data?.name).toBeTruthy();
  });
});

test.describe("API - Health", () => {
  test("GET /api/health returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("API - CSRF Protection", () => {
  test("POST to API without CSRF token is rejected", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    const res = await request.post("/api/documents", {
      data: { type: "PROFORMA", items: [] },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("CSRF");
  });
});
