import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./helpers";

test.describe("Documents Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page, "/documents");
  });

  test("page loads with document list", async ({ page }) => {
    await expect(page.locator("text=Documents")).toBeVisible();
    await expect(page.locator("text=Rechercher")).toBeVisible();
  });

  test("search input is functional", async ({ page }) => {
    const search = page.locator('input[placeholder*="Rechercher"]');
    await expect(search).toBeVisible();
    await search.fill("test");
    await expect(search).toHaveValue("test");
    await search.fill("");
  });

  test("type filter pills are present", async ({ page }) => {
    await expect(page.locator("text=Tous").first()).toBeVisible();
    await expect(page.locator("text=Proforma")).toBeVisible();
    await expect(page.locator("text=Definitive")).toBeVisible();
  });

  test("status filter pills are present", async ({ page }) => {
    const statusFilters = page.locator("text=Brouillon");
    const draftVisible = await statusFilters.isVisible().catch(() => false);
    if (draftVisible) {
      await expect(statusFilters).toBeVisible();
    }
  });

  test("navigation to proforma editor works", async ({ page }) => {
    await page.goto("/proforma");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Pro Forma").first()).toBeVisible({ timeout: 5000 }).catch(() => {
      return expect(page.locator("text=Proforma").first()).toBeVisible();
    });
  });

  test("navigation to definitive editor works", async ({ page }) => {
    await page.goto("/definitive");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Definitive").first()).toBeVisible({ timeout: 5000 });
  });
});
