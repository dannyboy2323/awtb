import { test, expect, type Locator, type Page } from '@playwright/test'

async function openFeaturedStory(page: Page) {
  await page.locator('.desk-hero a').first().click()
  await expect(page).toHaveURL(/\/stories\/[^/]+$/)
}

async function expectFullViewportWidth(page: Page, navigation: Locator) {
  const box = await navigation.boundingBox()
  expect(box?.x).toBe(0)
  expect(box?.width).toBe(await page.evaluate(() => window.innerWidth))
}

async function revealNavigation(page: Page) {
  await page.getByRole('button', { name: 'Show navigation' }).click()
}

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

  test('starts with a hidden home navigation and reveals only the About link', async ({ page }) => {
    const navigation = page.getByTestId('floating-nav')
    await expect(navigation).toHaveAttribute('aria-hidden', 'true')
    await expect(navigation).toHaveCSS('opacity', '0')
    await expect(page.getByRole('button', { name: 'Show navigation' })).toBeVisible()

    await revealNavigation(page)
    await expect(navigation).toHaveAttribute('aria-hidden', 'false')
    await expect(navigation).toHaveCSS('opacity', '1')
    await expect(navigation).toHaveCSS('position', 'fixed')
    await expectFullViewportWidth(page, navigation)
    await expect(page.getByRole('link', { name: 'Adventures With The Bull home' })).toBeVisible()
    const about = page.getByRole('link', { name: 'ABOUT' })
    await expect(about).toHaveAttribute('href', '/about')
    const themeFont = await page
      .locator('body')
      .evaluate((body) => getComputedStyle(body).fontFamily)
    await expect(about).toHaveCSS('font-family', themeFont)
    await expect(page.getByRole('button', { name: 'Share this page' })).not.toBeAttached()
    await expect(page.getByRole('link', { name: 'Download this story as EPUB' })).not.toBeAttached()
    await expect(
      page.getByRole('button', { name: 'Add this page to browser favorites' })
    ).not.toBeAttached()
  })

  test('opens the new About page from the home navigation', async ({ page }) => {
    await revealNavigation(page)
    await page.getByRole('link', { name: 'ABOUT' }).click()

    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible()
    const navigation = page.getByRole('navigation', { name: 'Site navigation' })
    await expect(navigation).toBeVisible()
    await expectFullViewportWidth(page, navigation)
  })

  test('renders the full-width story navigation without shifting the page', async ({ page }) => {
    await openFeaturedStory(page)
    const navigation = page.getByTestId('floating-nav')
    await expect(navigation).toHaveAttribute('aria-hidden', 'true')
    await expect(navigation).toHaveCSS('opacity', '0')

    await revealNavigation(page)
    await expect(navigation).toHaveAttribute('aria-hidden', 'false')
    await expect(navigation).toHaveCSS('opacity', '1')
    await expect(navigation).toHaveCSS('position', 'fixed')
    await expectFullViewportWidth(page, navigation)
    await expect(page.getByRole('link', { name: 'Adventures With The Bull home' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Share this page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download this story as EPUB' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Add this page to browser favorites' })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'ABOUT' })).not.toBeAttached()
  })

  test('opens the complete desktop share widget', async ({ page }) => {
    await openFeaturedStory(page)
    await revealNavigation(page)
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
    await openFeaturedStory(page)
    await revealNavigation(page)
    await page.getByRole('button', { name: 'Add this page to browser favorites' }).click()

    await expect(page.getByText('Add to browser favorites', { exact: true })).toBeVisible()
    await expect(page.getByText(/Ctrl\+D|⌘D/)).toBeVisible()
    await expect(page.getByText('Copy page link')).toBeVisible()
  })

  test('reveals the hidden navigation on arrow click or scroll', async ({ page }) => {
    await openFeaturedStory(page)
    const navigation = page.getByTestId('floating-nav')
    await expect(navigation).toHaveAttribute('aria-hidden', 'true')
    await expect(navigation).toHaveCSS('opacity', '0')

    await revealNavigation(page)
    await expect(navigation).toHaveAttribute('aria-hidden', 'false')
    await page.getByRole('button', { name: 'Hide navigation' }).click()
    await expect(navigation).toHaveAttribute('aria-hidden', 'true')

    await page.evaluate(() => window.scrollTo(0, 500))
    await expect(navigation).toHaveAttribute('aria-hidden', 'false')
  })

  test('downloads the current story as a valid EPUB', async ({ page }) => {
    await openFeaturedStory(page)
    await revealNavigation(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Download this story as EPUB' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('e2e-featured-story.epub')
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    expect(Buffer.concat(chunks).subarray(0, 2).toString()).toBe('PK')
  })
})
