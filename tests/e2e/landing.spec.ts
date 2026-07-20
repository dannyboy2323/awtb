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

  test('renders the floating navigation without shifting the page', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Reader navigation' })
    await expect(navigation).toBeVisible()
    await expect(navigation).toHaveCSS('position', 'fixed')
    await expect(page.getByRole('link', { name: 'Adventures With The Bull home' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Share this page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download featured story as EPUB' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Add this page to browser favorites' })
    ).toBeVisible()
  })

  test('opens the complete desktop share widget', async ({ page }) => {
    await page.getByRole('button', { name: 'Share this page' }).click()

    await expect(page.getByText('SMS / Messages')).toBeVisible()
    await expect(page.getByText('Email', { exact: true })).toBeVisible()
    await expect(page.getByText('Print', { exact: true })).toBeVisible()
    await expect(page.getByText('Facebook')).toBeVisible()
    await expect(page.getByText('X', { exact: true })).toBeVisible()
    await expect(page.getByText('Reddit')).toBeVisible()
    await expect(page.getByText('Instagram (copy link)')).toBeVisible()
    await expect(page.getByText('More apps & sites')).toBeVisible()
  })

  test('shows browser favorites guidance', async ({ page }) => {
    await page.getByRole('button', { name: 'Add this page to browser favorites' }).click()

    await expect(page.getByText('Add to browser favorites', { exact: true })).toBeVisible()
    await expect(page.getByText(/Ctrl\+D|⌘D/)).toBeVisible()
    await expect(page.getByText('Copy page link')).toBeVisible()
  })

  test('hides and reveals the floating navigation on click', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Reader navigation' })
    await page.getByRole('button', { name: 'Hide navigation' }).click()

    await expect(navigation).toBeHidden()
    const reveal = page.getByRole('button', { name: 'Show navigation' })
    await expect(reveal).toBeVisible()
    await reveal.click()
    await expect(navigation).toBeVisible()
  })

  test('downloads the featured story as a valid EPUB', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Download featured story as EPUB' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('e2e-featured-story.epub')
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    expect(Buffer.concat(chunks).subarray(0, 2).toString()).toBe('PK')
  })
})
