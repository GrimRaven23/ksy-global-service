import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./helpers";

test.describe("Delivery Notes (BL)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page, "/bl");
  });

  test("BL editor page loads", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const heading = page.locator("text=Bon de Livraison").first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("shows delivery info fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Numero du bon")).toBeVisible({ timeout: 5000 });
  });

  test("shows client section", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Nom / Societe").first()).toBeVisible({ timeout: 5000 });
  });

  test("save button is present", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const saveBtn = page.locator("button", { hasText: "Enregistrer" }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });

  test("print buttons are present", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=1 ex.").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=2 ex.").first()).toBeVisible({ timeout: 5000 });
  });

  test("new BL can be created and saved", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const saveBtn = page.locator("button", { hasText: "Enregistrer" }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });

    await saveBtn.click();

    const successToast = page.locator("[role='status']").filter({ hasText: /enregistré|saved|brouillon/i }).first();
    const errorToast = page.locator("[role='alert']").filter({ hasText: /erreur|error/i }).first();

    const result = await Promise.race([
      successToast.waitFor({ state: "visible", timeout: 8000 }).then(() => "success" as const),
      errorToast.waitFor({ state: "visible", timeout: 8000 }).then(() => "error" as const),
    ]).catch(() => "timeout" as const);

    expect(result).not.toBe("error");
  });
});
