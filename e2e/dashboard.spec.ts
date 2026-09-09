import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page, "/");
  });

  test("shows stat cards", async ({ page }) => {
    await expect(page.locator("text=Documents").first()).toBeVisible();
    await expect(page.locator("text=Revenus").first()).toBeVisible();
    await expect(page.locator("text=Ce mois").first()).toBeVisible();
    await expect(page.locator("text=Bons de livraison").first()).toBeVisible();
  });

  test("shows quick action buttons based on role", async ({ page }) => {
    const createPF = page.locator('a[href="/proforma"]');
    const createDF = page.locator('a[href="/definitive"]');
    const createBL = page.locator('a[href="/bl"]');

    const anyVisible =
      (await createPF.isVisible().catch(() => false)) ||
      (await createDF.isVisible().catch(() => false)) ||
      (await createBL.isVisible().catch(() => false));
    expect(anyVisible).toBeTruthy();
  });

  test("navigates to proforma editor", async ({ page }) => {
    const link = page.locator('a[href="/proforma"]').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await page.waitForURL("**/proforma*", { timeout: 10_000 });
      expect(page.url()).toContain("/proforma");
    }
  });

  test("navigates to documents page", async ({ page }) => {
    const link = page.locator('a[href="/documents"]').first();
    await link.click();
    await page.waitForURL("**/documents", { timeout: 10_000 });
    expect(page.url()).toContain("/documents");
  });

  test("navigation links are present in sidebar", async ({ page }) => {
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/documents"]').first()).toBeVisible();
  });
});
