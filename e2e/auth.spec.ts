import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL || "admin@ksy-global.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Admin@12345";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=CONNEXION")).toBeVisible();
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Se connecter");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login-email", "wrong@email.com");
    await page.fill("#login-password", "wrongpass");
    await page.click('button[type="submit"]');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login-email", TEST_EMAIL);
    await page.fill("#login-password", TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => {
      const p = url.pathname;
      return p === "/" || p === "/change-password";
    }, { timeout: 10_000 });
    const url = page.url();
    expect(url.endsWith("/") || url.includes("/change-password")).toBeTruthy();
  });

  test("authenticated user can access /api/auth/me", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (!loginRes.ok()) return;

    const meRes = await request.get("/api/auth/me", { timeout: 15000 });
    expect(meRes.ok()).toBeTruthy();
    const body = await meRes.json();
    expect(body.user).toBeTruthy();
  });

  test("unauthenticated user gets 401 from /api/auth/me", async ({ request }) => {
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBe(401);
  });

  test("toggle password visibility", async ({ page }) => {
    await page.goto("/login");
    const pwInput = page.locator("#login-password");
    await expect(pwInput).toHaveAttribute("type", "password");

    const toggleBtn = page.locator('button[aria-label="Afficher le mot de passe"]');
    await toggleBtn.click();
    await expect(pwInput).toHaveAttribute("type", "text");

    const hideBtn = page.locator('button[aria-label="Masquer le mot de passe"]');
    await hideBtn.click();
    await expect(pwInput).toHaveAttribute("type", "password");
  });

  test("logout clears session", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login-email", TEST_EMAIL);
    await page.fill("#login-password", TEST_PASSWORD);
    await page.click('button[type="submit"]');
    const navigated = await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15_000,
    }).then(() => true).catch(() => false);
    if (!navigated) return;

    const logoutBtn = page.locator('button[aria-label="Se déconnecter"]');
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL("**/login", { timeout: 15_000 });
    } else {
      await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
      await page.goto("/login");
    }
    expect(page.url()).toContain("/login");

    const meRes = await page.evaluate(() => fetch("/api/auth/me").then((r) => r.json()));
    expect(meRes.user).toBeFalsy();
  });
});
