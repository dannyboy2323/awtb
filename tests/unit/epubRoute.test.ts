import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  createStoryEpub: vi.fn(),
  getFeaturedStorySlug: vi.fn(),
  sanityFetch: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({ captureException: mocks.captureException }))
vi.mock('@/lib/epub', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/epub')>()
  return { ...original, createStoryEpub: mocks.createStoryEpub }
})
vi.mock('@/lib/edge-config', () => ({ getFeaturedStorySlug: mocks.getFeaturedStorySlug }))
vi.mock('@/sanity/lib/live', () => ({ sanityFetch: mocks.sanityFetch }))

import { GET } from '@/app/api/epub/route'

function request(query = '') {
  return new Request(`https://example.com/api/epub${query}`)
}

function story(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'story-id',
    title: 'A Story',
    slug: { current: 'a-story' },
    publishedAt: '2026-01-01T00:00:00.000Z',
    coverImage: null,
    body: [],
    ...overrides,
  }
}

describe('GET /api/epub', () => {
  beforeEach(() => {
    vi.stubEnv('E2E_TEST', 'false')
    mocks.captureException.mockReset()
    mocks.createStoryEpub.mockReset().mockResolvedValue(new Uint8Array([80, 75, 3, 4]))
    mocks.getFeaturedStorySlug.mockReset()
    mocks.sanityFetch.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects malformed story slugs before reading data', async () => {
    const response = await GET(request('?slug=../private'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid story slug' })
    expect(mocks.sanityFetch).not.toHaveBeenCalled()
  })

  it('returns a deterministic EPUB in browser-test mode', async () => {
    vi.stubEnv('E2E_TEST', 'true')

    const response = await GET(request())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/epub+zip')
    expect(response.headers.get('content-disposition')).toContain('e2e-featured-story.epub')
    expect(mocks.createStoryEpub).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'e2e-featured-story' })
    )
    expect(mocks.getFeaturedStorySlug).not.toHaveBeenCalled()
  })

  it('returns 404 when no featured story is configured', async () => {
    mocks.getFeaturedStorySlug.mockResolvedValue(null)

    const response = await GET(request())

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'No featured story is configured' })
  })

  it('returns 404 when the requested story does not exist', async () => {
    mocks.sanityFetch.mockResolvedValue({ data: null })

    const response = await GET(request('?slug=missing-story'))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Story not found' })
  })

  it('normalizes a complete Sanity story and returns cacheable download headers', async () => {
    mocks.sanityFetch.mockResolvedValue({
      data: story({
        title: null,
        coverImage: {
          alt: 'Story cover',
          asset: { url: 'https://cdn.sanity.io/cover.jpg' },
        },
        body: null,
      }),
    })

    const response = await GET(request('?slug=a-story'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-length')).toBe('4')
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(mocks.createStoryEpub).toHaveBeenCalledWith({
      id: 'story-id',
      slug: 'a-story',
      title: 'Untitled Story',
      publishedAt: '2026-01-01T00:00:00.000Z',
      coverImage: {
        url: 'https://cdn.sanity.io/cover.jpg',
        alt: 'Story cover',
      },
      body: [],
    })
  })

  it('normalizes missing cover data and supports a requested non-fixture in test mode', async () => {
    vi.stubEnv('E2E_TEST', 'true')
    mocks.sanityFetch.mockResolvedValue({
      data: story({ coverImage: { asset: null }, body: [{}] }),
    })

    const response = await GET(request('?slug=another-story'))

    expect(response.status).toBe(200)
    expect(mocks.createStoryEpub).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'another-story',
        title: 'A Story',
        coverImage: null,
        body: [{}],
      })
    )
  })

  it('captures generation failures and returns a stable server error', async () => {
    const error = new Error('zip failed')
    mocks.sanityFetch.mockRejectedValue(error)

    const response = await GET(request('?slug=a-story'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Unable to generate EPUB' })
    expect(mocks.captureException).toHaveBeenCalledWith(error)
  })
})
