import { test, expect } from "@playwright/test";

/**
 * Checkly production browser check — Landing page.
 *
 * Runs every 5 minutes from multiple global locations against
 * https://awtb.vercel.app. Alerts on failure.
 *
 * baseURL is set in checkly.config.ts via playwrightConfig.use.baseURL
 */
test("Landing page loads with desk hero", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);

  // Desk hero section must be present
  const hero = page.locator(".desk-hero");
  await expect(hero).toBeVisible();

  // Featured postcard link must be present
  const link = hero.locator("a").first();
  await expect(link).toBeVisible();

  await page.screenshot({ path: "landing.jpg" });
});

test("Studio loads without 404", async ({ page }) => {
  const response = await page.goto("/studio");
  expect(response?.status()).toBeLessThan(400);
});
