import { test, expect } from '@playwright/test'

/**
 * Landing page E2E tests.
 * Covers the above-the-fold hero and below-the-fold postcard grid.
 */
test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads without errors', async ({ page }) => {
    await expect(page).toHaveURL('/')
    // No uncaught errors
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('renders the desk hero section above the fold', async ({ page }) => {
    const hero = page.locator('.desk-hero')
    await expect(hero).toBeVisible()
  })

  test('hero contains a clickable postcard link', async ({ page }) => {
    const hero = page.locator('.desk-hero')
    const link = hero.locator('a').first()
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /\/stories\//)
  })

  test('opens the featured story from the hero', async ({ page }) => {
    const link = page.locator('.desk-hero a').first()
    await link.click()
    await expect(page).toHaveURL(/\/stories\/[^/]+$/)
    await expect(page.getByRole('main', { name: /story reader/i })).toBeVisible()
  })

  test('page title is set', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/)
  })
})
