/**
 * StoryReader unit tests
 *
 * Covers:
 *   - The portrait / default single-spread layout (cover left, body right).
 *   - Cover image orientation variants and placeholder fallback.
 *   - Inline panel alignment classes, captions, and the lightbox.
 *   - Landscape pagination: when orientation is landscape the component
 *     measures the body and renders paginated book spreads.
 *
 * jsdom has no layout engine (offsetHeight is 0), so in the landscape tests all
 * blocks measure to a single page. We assert the paginated structure appears
 * and all content is still present — the measurement math itself is exercised
 * in the browser, not here.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import StoryReader from '@/components/public/StoryReader'

// ─────────────────────────────────────────────────────────────────────────────
// Environment shims (jsdom)
// ─────────────────────────────────────────────────────────────────────────────

// requestAnimationFrame / cancelAnimationFrame are used by the orientation and
// pagination hooks. Provide deterministic microtask-ish implementations.
if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame
}
if (typeof globalThis.cancelAnimationFrame !== 'function') {
  globalThis.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>)) as typeof cancelAnimationFrame
}

/**
 * Install a matchMedia mock that reports the given orientation.
 * @param landscape true → matches '(orientation: landscape)'.
 */
function mockMatchMedia(landscape: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: landscape && query.includes('landscape'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock next/image
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
    width,
    height,
  }: {
    src: string
    alt: string
    className?: string
    width?: number
    height?: number
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} width={width} height={height} />
  ),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const COVER_IMAGE = {
  asset: { _id: 'cover-id', url: 'https://cdn.sanity.io/test/cover.webp' },
  alt: 'Story cover art',
}

const PORTRAIT_COVER = {
  asset: { _id: 'portrait-id', url: 'https://cdn.sanity.io/test/cover-portrait.webp' },
  alt: 'Story cover art portrait',
}

const PANEL_LEFT = {
  _type: 'panelImage',
  _key: 'p1',
  alignment: 'left' as const,
  alt: 'Left panel',
  caption: null,
  image: {
    asset: {
      _id: 'img1',
      url: 'https://cdn.sanity.io/test/img1.webp',
      metadata: { dimensions: { width: 280, height: 280 } },
    },
  },
}

const PANEL_RIGHT = {
  _type: 'panelImage',
  _key: 'p2',
  alignment: 'right' as const,
  alt: 'Right panel',
  caption: 'A caption',
  image: {
    asset: {
      _id: 'img2',
      url: 'https://cdn.sanity.io/test/img2.webp',
      metadata: { dimensions: { width: 280, height: 280 } },
    },
  },
}

const TEXT_BLOCK = {
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  children: [{ _type: 'span', _key: 's1', text: 'Story prose text.', marks: [] }],
  markDefs: [],
}

const SAMPLE_BODY = [PANEL_LEFT, TEXT_BLOCK, PANEL_RIGHT]

// ─────────────────────────────────────────────────────────────────────────────
// Portrait / default layout tests
// (window.matchMedia is left undefined → orientation is "unknown" → single spread)
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — single spread (portrait / default)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure orientation stays unknown so the component renders the fallback.
    // @ts-expect-error deliberately removing for the default-layout suite
    delete window.matchMedia
  })

  it('renders without crashing', () => {
    render(<StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(document.querySelector('.story-reader')).toBeTruthy()
  })

  it('renders accessible main label', () => {
    render(<StoryReader title="Adventures" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(screen.getByRole('main', { name: 'Adventures — story reader' })).toBeTruthy()
  })

  it('renders exactly one journal-spread', () => {
    render(<StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(document.querySelectorAll('.journal-spread').length).toBe(1)
  })

  it('renders landscape cover image', () => {
    render(<StoryReader title="T" coverImage={COVER_IMAGE} coverImagePortrait={null} body={[]} />)
    expect(screen.getAllByAltText('Story cover art')[0]).toBeTruthy()
  })

  it('renders portrait cover image', () => {
    render(
      <StoryReader
        title="T"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={[]}
      />
    )
    expect(screen.getAllByAltText('Story cover art portrait')[0]).toBeTruthy()
  })

  it('falls back to landscape cover when no portrait provided', () => {
    render(<StoryReader title="T" coverImage={COVER_IMAGE} coverImagePortrait={null} body={[]} />)
    expect(screen.getAllByAltText('Story cover art').length).toBeGreaterThanOrEqual(1)
  })

  it('renders cover placeholder when no cover image', () => {
    render(<StoryReader title="No Cover" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(document.querySelector('.cover-placeholder')).toBeTruthy()
    expect(document.querySelector('.cover-title')?.textContent).toBe('No Cover')
  })

  it('renders body prose text', () => {
    render(<StoryReader title="T" coverImage={null} coverImagePortrait={null} body={SAMPLE_BODY} />)
    expect(screen.getByText('Story prose text.')).toBeTruthy()
  })

  it('renders placeholder when body is empty array', () => {
    render(<StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(screen.getByText('No content yet.')).toBeTruthy()
  })

  it('renders placeholder when body is null', () => {
    render(<StoryReader title="T" coverImage={null} coverImagePortrait={null} body={null} />)
    expect(screen.getByText('No content yet.')).toBeTruthy()
  })

  it('renders left-aligned panel with inline-panel--left class', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    expect(document.querySelector('.inline-panel--left')).toBeTruthy()
    expect(document.querySelector('.inline-panel--right')).toBeFalsy()
  })

  it('renders right-aligned panel with inline-panel--right class', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_RIGHT]} />
    )
    expect(document.querySelector('.inline-panel--right')).toBeTruthy()
    expect(document.querySelector('.inline-panel--left')).toBeFalsy()
  })

  it('renders panel caption when present', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_RIGHT]} />
    )
    expect(screen.getByText('A caption')).toBeTruthy()
  })

  it('opens lightbox when panel button is clicked', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Left panel' }))
    expect(document.querySelector('.lightbox-overlay')).toBeTruthy()
  })

  it('closes lightbox when overlay is clicked', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Left panel' }))
    fireEvent.click(document.querySelector('.lightbox-overlay')!)
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })

  it('closes lightbox via close button', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Left panel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close image' }))
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Landscape pagination tests
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — landscape pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia(true)
  })

  afterEach(() => {
    // @ts-expect-error cleanup so the default-layout suite stays orientation-unknown
    delete window.matchMedia
  })

  it('applies paginated page class in landscape', async () => {
    render(
      <StoryReader
        title="T"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    await waitFor(() => {
      expect(document.querySelector('.journal-page--paginated')).toBeTruthy()
    })
  })

  it('still renders all body content when paginated', async () => {
    render(
      <StoryReader
        title="T"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Story prose text.')).toBeTruthy()
      expect(document.querySelector('.inline-panel--left')).toBeTruthy()
      expect(document.querySelector('.inline-panel--right')).toBeTruthy()
    })
  })

  it('keeps the cover on the first spread in landscape', async () => {
    render(
      <StoryReader
        title="T"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    await waitFor(() => {
      const firstSpread = document.querySelector('.journal-spread')
      expect(firstSpread?.querySelector('.journal-book--cover')).toBeTruthy()
      expect(firstSpread?.querySelector('.cover-image--landscape')).toBeTruthy()
    })
  })

  it('renders the single-spread fallback for an empty body in landscape', async () => {
    render(<StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[]} />)
    // Empty body never paginates — placeholder from the fallback spread remains.
    await waitFor(() => {
      expect(screen.getByText('No content yet.')).toBeTruthy()
    })
    expect(document.querySelector('.journal-page--paginated')).toBeFalsy()
  })
})
