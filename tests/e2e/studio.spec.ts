import { test, expect } from "@playwright/test";

/**
 * Sanity Studio E2E tests.
 * Verifies the embedded Studio loads correctly at /studio.
 */
test.describe("Sanity Studio", () => {
  test("loads at /studio without a 404 or 500", async ({ page }) => {
    test.setTimeout(60000);
    const response = await page.goto("/studio");
    expect(response?.status()).toBeLessThan(400);
  });

  test("renders the Studio UI", async ({ page }) => {
    await page.goto("/studio");
    // Studio takes a moment to hydrate — wait for any Studio element
    await page.waitForLoadState("domcontentloaded");
    const body = await page.content();
    // Studio should render something beyond a bare HTML shell
    expect(body.length).toBeGreaterThan(1000);
  });
});
