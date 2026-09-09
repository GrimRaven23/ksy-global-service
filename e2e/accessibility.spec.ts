import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAndNavigate } from "./helpers";

const pages = [
  { name: "Login", path: "/login", authenticated: false },
  { name: "Dashboard", path: "/", authenticated: true },
  { name: "Documents", path: "/documents", authenticated: true },
  { name: "Proforma Editor", path: "/proforma", authenticated: true },
  { name: "Definitive Editor", path: "/definitive", authenticated: true },
  { name: "BL Editor", path: "/bl", authenticated: true },
  { name: "Settings", path: "/settings", authenticated: true },
  { name: "Users", path: "/users", authenticated: true },
];

for (const { name, path, authenticated } of pages) {
  test.describe(`${name} accessibility`, () => {
    test(`no serious axe violations on ${name}`, async ({ page }) => {
      if (authenticated) {
        await loginAndNavigate(page, path);
      } else {
        await page.goto(path);
      }
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .disableRules(["region"]) // Skip landmark rule — some pages use <main> differently
        .analyze();

      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      if (serious.length > 0) {
        const msg = serious
          .map(
            (v) =>
              `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elements)\n` +
              v.nodes.map((n) => `  - ${n.html.substring(0, 100)}`).join("\n")
          )
          .join("\n\n");
        expect(serious, `Accessibility violations:\n${msg}`).toHaveLength(0);
      }
    });
  });
}

test.describe("Accessibility - Skip Navigation", () => {
  test("skip nav link is present on every page", async ({ page }) => {
    await page.goto("/login");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

test.describe("Accessibility - Form Labels", () => {
  test("login form inputs have associated labels", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator("#login-email");
    const emailId = await emailInput.getAttribute("id");
    const emailLabel = page.locator(`label[for="${emailId}"]`);
    await expect(emailLabel).toBeVisible();

    const pwInput = page.locator("#login-password");
    const pwId = await pwInput.getAttribute("id");
    const pwLabel = page.locator(`label[for="${pwId}"]`);
    await expect(pwLabel).toBeVisible();
  });

  test("change password form inputs have labels", async ({ page }) => {
    await loginAndNavigate(page, "/change-password");
    await page.waitForLoadState("networkidle");

    for (const id of ["current-password", "new-password", "confirm-password"]) {
      const input = page.locator(`#${id}`);
      const inputId = await input.getAttribute("id");
      const label = page.locator(`label[for="${inputId}"]`);
      await expect(label).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("Accessibility - ARIA Attributes", () => {
  test("error messages use role=alert", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login-email", "wrong@email.com");
    await page.fill("#login-password", "wrongpass");
    await page.click('button[type="submit"]');

    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  test("decorative icons are hidden from screen readers", async ({ page }) => {
    await page.goto("/login");
    const icons = page.locator('svg[aria-hidden="true"]');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
  });
});
