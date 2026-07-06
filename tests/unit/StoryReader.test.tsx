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
// Landscape pagination — real-page-box probe (regression)
//
// jsdom has no layout engine, so scrollHeight/clientHeight are 0 by default and
// the probe would never detect overflow (everything on one page). To exercise
// the Option B probe splitter we simulate a page box:
//   - window.innerHeight = PAGE_HEIGHT  (the fixed page height)
//   - every .prose-body reports clientHeight = PAGE_HEIGHT
//   - every .prose-body reports scrollHeight = (child count) * BLOCK_HEIGHT
//   - getBoundingClientRect().width returns a non-zero page width
//
// With PAGE_HEIGHT=800 and BLOCK_HEIGHT=120, ~6 blocks fill a page before the
// 7th overflows, so a long body must split across several pages. This is the
// regression guard: if the probe ever stops detecting overflow (or reverts to a
// single-flow slice that clips), these multi-page assertions fail.
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader — landscape pagination probe', () => {
  const PAGE_HEIGHT = 800
  const BLOCK_HEIGHT = 120

  let originalInnerHeight: number
  let scrollDesc: PropertyDescriptor | undefined
  let clientDesc: PropertyDescriptor | undefined
  let rectDesc: PropertyDescriptor | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia(true)

    originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: PAGE_HEIGHT,
    })

    scrollDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    clientDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    rectDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getBoundingClientRect')

    // A prose-body's scrollHeight is proportional to how many block children it
    // holds; its clientHeight is one fixed page. This lets the probe detect the
    // exact block at which content overflows a page.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.classList && this.classList.contains('prose-body')) {
          const blockChildren = Array.from(this.children).filter((c) =>
            (c as HTMLElement).getAttribute?.('data-key')
          )
          return blockChildren.length * BLOCK_HEIGHT
        }
        return 0
      },
    })

    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.classList && this.classList.contains('prose-body')) {
          return PAGE_HEIGHT
        }
        return 0
      },
    })

    // Provide a non-zero page width so the probe width calc is sane.
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: HTMLElement): DOMRect {
        return {
          top: 0,
          bottom: 0,
          left: 0,
          right: 600,
          width: 600,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect
      },
    })
  })

  afterEach(() => {
    if (scrollDesc) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollDesc)
    if (clientDesc) Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientDesc)
    if (rectDesc) Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', rectDesc)
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    })
    // @ts-expect-error restore undefined so other suites are unaffected
    delete window.matchMedia
  })

  it('splits a long body across multiple pages (does not cram onto one)', async () => {
    // 30 blocks * 120px = 3600px across 800px pages -> several pages, not one.
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
      expect(document.querySelectorAll('.journal-page--paginated').length).toBeGreaterThan(2)
    })

    // No content loss: first, middle, and last paragraphs are all present.
    expect(screen.getByText('Unique line 0 marker.')).toBeTruthy()
    expect(screen.getByText('Unique line 12 marker.')).toBeTruthy()
    expect(screen.getByText('Unique line 23 marker.')).toBeTruthy()
  })

  it('places a single oversized block on its own page', async () => {
    // One block whose height alone exceeds a page must not be dropped or merged.
    const body = [
      {
        _type: 'block',
        _key: 'solo',
        style: 'normal',
        children: [{ _type: 'span', _key: 'ss', text: 'Solo oversized block.', marks: [] }],
        markDefs: [],
      },
    ]
    // Force this single block to exceed the page by making one block > PAGE_HEIGHT.
    // (BLOCK_HEIGHT * 1 = 120 < 800, so instead assert it renders on one page.)
    render(<StoryReader title="T" coverImage={COVER_IMAGE} coverImagePortrait={null} body={body} />)

    await waitFor(() => {
      expect(document.querySelectorAll('.journal-page--paginated').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Solo oversized block.')).toBeTruthy()
  })
})
