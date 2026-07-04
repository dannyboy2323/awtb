/**
 * StoryReader unit tests
 *
 * Covers:
 *   - normalizeBlocks: unique key generation, field preservation.
 *   - Portrait / default single-spread layout.
 *   - Cover image orientation variants and placeholder fallback.
 *   - Inline panel alignment classes, captions, lightbox open/close.
 *   - Lightbox: full-resolution URL (fit=max q=100) assertion.
 *   - Lightbox keyboard: Escape closes the overlay.
 *   - Landscape pagination: paginated page class, content presence, cover position.
 *
 * jsdom has no layout engine (getBoundingClientRect returns zeros) so all
 * blocks measure to a single page in landscape tests. We assert the paginated
 * structure is present and all content is still rendered — the measurement
 * arithmetic is exercised in the browser, not here.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import StoryReader, { normalizeBlocks } from '@/components/public/StoryReader'

// ─────────────────────────────────────────────────────────────────────────────
// Environment shims (jsdom)
// ─────────────────────────────────────────────────────────────────────────────

if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame
}
if (typeof globalThis.cancelAnimationFrame !== 'function') {
  globalThis.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>)) as typeof cancelAnimationFrame
}

/**
 * Install a matchMedia mock for the given orientation.
 * @param landscape true → query '(orientation: landscape)' returns true.
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
// normalizeBlocks
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeBlocks', () => {
  it('generates unique keys even when input has duplicate _key values', () => {
    const input = [
      { _type: 'block', _key: 'abc' },
      { _type: 'block', _key: 'abc' }, // duplicate
      { _type: 'block', _key: 'def' },
    ]
    const result = normalizeBlocks(input)
    expect(result[0]._key).toBe('blk-0-abc')
    expect(result[1]._key).toBe('blk-1-abc')
    expect(result[2]._key).toBe('blk-2-def')
    expect(new Set(result.map((b) => b._key)).size).toBe(3)
  })

  it('preserves all non-key fields on each block', () => {
    const input = [{ _type: 'panelImage', _key: 'k1', alignment: 'left', caption: 'hi' }]
    const result = normalizeBlocks(input)
    expect(result[0]._type).toBe('panelImage')
    expect(result[0].alignment).toBe('left')
    expect(result[0].caption).toBe('hi')
    expect(result[0]._key).toBe('blk-0-k1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Single spread (portrait / default)
// matchMedia left undefined → orientation unknown → SingleSpread fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — single spread (portrait / default)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error deliberately removing matchMedia for the default-layout suite
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

  it('lightbox image uses full-resolution URL (fit=max, q=100)', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Left panel' }))
    const lb = document.querySelector('.lightbox-image') as HTMLImageElement | null
    expect(lb).toBeTruthy()
    expect(lb?.src).toContain('fit=max')
    expect(lb?.src).toContain('q=100')
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
// Lightbox keyboard
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — lightbox keyboard', () => {
  it('closes the lightbox when Escape is pressed', () => {
    render(
      <StoryReader title="T" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Left panel' }))
    const overlay = document.querySelector('.lightbox-overlay')
    expect(overlay).toBeTruthy()
    fireEvent.keyDown(overlay!, { key: 'Escape' })
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Landscape pagination
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — landscape pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia(true)
  })

  afterEach(() => {
    // @ts-expect-error restore undefined so the default-layout suite is unaffected
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
    await waitFor(() => {
      expect(screen.getByText('No content yet.')).toBeTruthy()
    })
    expect(document.querySelector('.journal-page--paginated')).toBeFalsy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Landscape pagination — geometry-driven splitting (regression)
//
// jsdom has no layout engine, so by default every getBoundingClientRect()
// returns zeros and all blocks land on a single page. To actually exercise the
// page-splitting math — and lock in the fix for the bug where the whole story
// crammed onto page 1 and clipped — we stub window.innerHeight and give each
// measured block a deterministic height via getBoundingClientRect.
//
// Regression guard: if the paginator ever again reads the auto-grown measurer
// height instead of window.innerHeight, `available` becomes enormous and every
// block collapses onto one page; the multi-page assertions below then fail.
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — landscape pagination geometry', () => {
  const PAGE_HEIGHT = 800 // simulated viewport / page box height (px)
  const BLOCK_HEIGHT = 100 // simulated height per top-level block (px)

  let originalRect: typeof HTMLElement.prototype.getBoundingClientRect
  let originalInnerHeight: number

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia(true)

    originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: PAGE_HEIGHT,
    })

    // Stub geometry: each element with a data-key stacks BLOCK_HEIGHT tall in
    // document order; the prose-body starts at y=0; pages/other elements report
    // zero-size boxes (their height is not used by the paginator).
    originalRect = HTMLElement.prototype.getBoundingClientRect
    let cursor = 0
    const seen = new Map<Element, { top: number; bottom: number }>()
    HTMLElement.prototype.getBoundingClientRect = function (): DOMRect {
      const el = this as HTMLElement
      if (el.getAttribute && el.getAttribute('data-key')) {
        if (!seen.has(el)) {
          const top = cursor
          cursor += BLOCK_HEIGHT
          seen.set(el, { top, bottom: top + BLOCK_HEIGHT })
        }
        const { top, bottom } = seen.get(el)!
        return {
          top,
          bottom,
          left: 0,
          right: 0,
          width: 0,
          height: BLOCK_HEIGHT,
          x: 0,
          y: top,
          toJSON: () => ({}),
        } as DOMRect
      }
      // prose-body and page report a zero-origin box.
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect
    }
  })

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalRect
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    })
    // @ts-expect-error restore undefined so other suites are unaffected
    delete window.matchMedia
  })

  it('splits a long body across multiple pages (does not cram onto one)', async () => {
    // 30 text blocks at 100px each = 3000px of content across ~800px pages,
    // so the story MUST occupy several pages, not a single overflowing one.
    const longBody = Array.from({ length: 30 }, (_, i) => ({
      _type: 'block',
      _key: `p${i}`,
      style: 'normal',
      children: [{ _type: 'span', _key: `s${i}`, text: `Paragraph ${i}.`, marks: [] }],
      markDefs: [],
    }))

    render(
      <StoryReader title="T" coverImage={COVER_IMAGE} coverImagePortrait={null} body={longBody} />
    )

    await waitFor(() => {
      const pages = document.querySelectorAll('.journal-page--paginated')
      // With ~7 blocks per 800px page (minus padding + safety buffer), 30 blocks
      // spread across clearly more than two pages.
      expect(pages.length).toBeGreaterThan(3)
    })
  })

  it('renders every paragraph of a long body somewhere in the paginated output', async () => {
    const longBody = Array.from({ length: 24 }, (_, i) => ({
      _type: 'block',
      _key: `q${i}`,
      style: 'normal',
      children: [{ _type: 'span', _key: `t${i}`, text: `Unique line ${i} marker.`, marks: [] }],
      markDefs: [],
    }))

    render(
      <StoryReader title="T" coverImage={COVER_IMAGE} coverImagePortrait={null} body={longBody} />
    )

    await waitFor(() => {
      expect(document.querySelectorAll('.journal-page--paginated').length).toBeGreaterThan(3)
    })

    // No content loss: first, middle, and last paragraphs are all present.
    expect(screen.getByText('Unique line 0 marker.')).toBeTruthy()
    expect(screen.getByText('Unique line 12 marker.')).toBeTruthy()
    expect(screen.getByText('Unique line 23 marker.')).toBeTruthy()
  })
})
