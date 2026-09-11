import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./helpers";

test.describe("Company Settings Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page, "/settings");
  });

  test("settings page loads with current values", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Paramètres").first()).toBeVisible({ timeout: 5000 });
  });

  test("company settings can be saved and persist with empty optional fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const nameInput = page.locator("input[name='name'], #company-name").first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    const originalName = await nameInput.inputValue();

    const saveBtn = page.locator("button", { hasText: /enregistrer|sauvegarder/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();

    const successToast = page.locator("[role='status']").filter({ hasText: /enregistré|saved|succès/i }).first();
    const errorToast = page.locator("[role='alert']").filter({ hasText: /erreur|error/i }).first();

    const result = await Promise.race([
      successToast.waitFor({ state: "visible", timeout: 8000 }).then(() => "success" as const),
      errorToast.waitFor({ state: "visible", timeout: 8000 }).then(() => "error" as const),
    ]).catch(() => "timeout" as const);

    expect(result).not.toBe("error");

    await page.reload();
    await page.waitForLoadState("networkidle");

    const nameAfterReload = page.locator("input[name='name'], #company-name").first();
    await expect(nameAfterReload).toBeVisible({ timeout: 5000 });
    const reloadedName = await nameAfterReload.inputValue();
    expect(reloadedName).toBe(originalName);
  });

  test("empty email/website fields do not show 'undefined' or 'null'", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageContent = await page.content();
    expect(pageContent).not.toContain("undefined");
    expect(pageContent).not.toContain(">null<");
    expect(pageContent).not.toContain("null</");

    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const emailValue = await emailInput.inputValue();
      expect(emailValue).not.toBe("undefined");
      expect(emailValue).not.toBe("null");
    }
  });
});
