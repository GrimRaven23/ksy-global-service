import { type Page, type BrowserContext, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL || "admin@ksy-global.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Admin@12345";

export async function setupTestUser(page: Page) {
  const res = await page.request.post("/api/auth/login", {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  const body = await res.json();
  if (!body.ok && body.error === "Identifiants incorrects") {
    throw new Error(
      `Test user not found. Set TEST_EMAIL and TEST_PASSWORD env vars, ` +
      `or ensure the user exists in the database.`
    );
  }
  return body;
}

export async function loginViaAPI(
  request: any,
  email = TEST_EMAIL,
  password = TEST_PASSWORD
) {
  const res = await request.post("/api/auth/login", {
    data: { email, password },
  });
  return res.json();
}

export async function loginAndNavigate(page: Page, path = "/") {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  const isOnLoginPage = page.url().includes("/login");
  if (isOnLoginPage) {
    await page.fill("#login-email", TEST_EMAIL);
    await page.fill("#login-password", TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10_000,
    });
    await page.waitForLoadState("networkidle");
  }

  if (path !== "/") {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('button[aria-label="Se déconnecter"]');
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL("**/login", { timeout: 10_000 });
  } else {
    await page.request.post("/api/auth/logout");
    await page.goto("/login");
  }
}

export async function expectAuthenticated(page: Page) {
  const me = await page.request.get("/api/auth/me");
  const body = await me.json();
  expect(body.user).toBeTruthy();
  return body.user;
}

export async function expectUnauthenticated(page: Page) {
  const me = await page.request.get("/api/auth/me");
  expect(me.status()).toBe(401);
}
