/**
 * StoryReader unit tests
 *
 * Tests the StoryReader component with the new `body` prop (flat Portable Text
 * array) replacing the old `pages[]` array. Pagination is tested in portrait
 * mode only (landscape pagination requires real DOM measurement which is not
 * available in JSDOM).
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StoryReader from '@/components/public/StoryReader'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const COVER_IMAGE = {
  asset: {
    _id: 'cover-asset-id',
    url: 'https://cdn.sanity.io/images/test/production/cover.webp',
  },
  alt: 'Story cover art',
}

const PORTRAIT_COVER = {
  asset: {
    _id: 'portrait-asset-id',
    url: 'https://cdn.sanity.io/images/test/production/cover-portrait.webp',
  },
  alt: 'Story cover art portrait',
}

const PANEL_IMAGE_BLOCK = {
  _type: 'panelImage',
  _key: 'panel-1',
  alignment: 'left' as const,
  alt: 'Panel illustration panel-1',
  caption: null,
  image: {
    asset: {
      _id: 'panel-asset-1',
      url: 'https://cdn.sanity.io/images/test/production/panel-1.webp',
      metadata: { dimensions: { width: 280, height: 280 } },
    },
  },
}

const TEXT_BLOCK = {
  _type: 'block',
  _key: 'text-1',
  style: 'normal',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Once upon a time in the Wild West, Roosevelt led the charge.',
      marks: [],
    },
  ],
  markDefs: [],
}

const TEXT_BLOCK_2 = {
  _type: 'block',
  _key: 'text-2',
  style: 'normal',
  children: [
    {
      _type: 'span',
      _key: 'span-2',
      text: 'The rough riders galloped through the Cuban hillside.',
      marks: [],
    },
  ],
  markDefs: [],
}

const PANEL_IMAGE_BLOCK_2 = {
  _type: 'panelImage',
  _key: 'panel-2',
  alignment: 'right' as const,
  alt: 'Panel illustration panel-2',
  caption: 'A historic moment',
  image: {
    asset: {
      _id: 'panel-asset-2',
      url: 'https://cdn.sanity.io/images/test/production/panel-2.webp',
      metadata: { dimensions: { width: 280, height: 280 } },
    },
  },
}

const SAMPLE_BODY = [PANEL_IMAGE_BLOCK, TEXT_BLOCK, PANEL_IMAGE_BLOCK_2, TEXT_BLOCK_2]

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
// Mock orientation (default to portrait so no pagination runs in tests)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useOrientation', () => ({
  useOrientation: () => 'portrait',
}))

vi.mock('@/hooks/usePagination', () => ({
  usePagination: () => ({
    pages: [],
    measureRef: { current: null },
    isReady: false,
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing with full props', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={SAMPLE_BODY}
      />
    )
    expect(document.querySelector('.story-reader')).toBeTruthy()
  })

  it('renders the landscape cover image', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={SAMPLE_BODY}
      />
    )
    // Both images rendered; CSS controls visibility
    const coverImages = screen.getAllByAltText('Story cover art')
    expect(coverImages.length).toBeGreaterThanOrEqual(1)
    expect(coverImages[0]).toBeTruthy()
  })

  it('renders the portrait cover image', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={SAMPLE_BODY}
      />
    )
    expect(screen.getAllByAltText('Story cover art portrait')).toBeTruthy()
  })

  it('falls back to landscape cover when no portrait image provided', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    // Should still render — landscape image used as fallback
    expect(screen.getAllByAltText('Story cover art').length).toBeGreaterThanOrEqual(1)
  })

  it('renders cover placeholder when no coverImage provided', () => {
    render(
      <StoryReader
        title="No Cover Story"
        coverImage={null}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    expect(document.querySelector('.cover-placeholder')).toBeTruthy()
    expect(document.querySelector('.cover-title')).toBeTruthy()
  })

  it('renders prose text from body in portrait mode', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    expect(
      screen.getAllByText('Once upon a time in the Wild West, Roosevelt led the charge.')[0]
    ).toBeTruthy()
    expect(
      screen.getAllByText('The rough riders galloped through the Cuban hillside.')[0]
    ).toBeTruthy()
  })

  it('renders inline panel images from body', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    expect(screen.getAllByAltText('Panel illustration panel-1')).toBeTruthy()
    expect(screen.getAllByAltText('Panel illustration panel-2')).toBeTruthy()
  })

  it('renders portrait layout when body is null', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        coverImagePortrait={null}
        body={null}
      />
    )
    // Should render without crashing; story-reader wrapper present
    expect(document.querySelector('.story-reader')).toBeTruthy()
  })

  it('renders hidden measurement container', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    // Measurement div is always in the DOM (hidden via aria-hidden + CSS)
    const measureDivs = document.querySelectorAll('[aria-hidden="true"]')
    expect(measureDivs.length).toBeGreaterThan(0)
  })

  it('opens lightbox when panel image button is clicked', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    const panelBtn = screen.getByRole('button', {
      name: 'View full size: Panel illustration panel-1',
    })
    fireEvent.click(panelBtn)
    expect(document.querySelector('.lightbox-overlay')).toBeTruthy()
  })

  it('closes lightbox when overlay is clicked', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    const panelBtn = screen.getByRole('button', {
      name: 'View full size: Panel illustration panel-1',
    })
    fireEvent.click(panelBtn)
    expect(document.querySelector('.lightbox-overlay')).toBeTruthy()

    const overlay = document.querySelector('.lightbox-overlay')!
    fireEvent.click(overlay)
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })

  it('closes lightbox when close button is clicked', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    const panelBtn = screen.getByRole('button', {
      name: 'View full size: Panel illustration panel-1',
    })
    fireEvent.click(panelBtn)
    expect(document.querySelector('.lightbox-overlay')).toBeTruthy()

    const closeBtn = screen.getByRole('button', { name: 'Close image' })
    fireEvent.click(closeBtn)
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })

  it('renders portrait body section with all content', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        coverImagePortrait={null}
        body={[TEXT_BLOCK, TEXT_BLOCK_2]}
      />
    )
    // In portrait mode, all content is in a single continuous body section
    expect(document.querySelectorAll('.journal-spread').length).toBe(2) // cover + body
    expect(
      screen.getByText('Once upon a time in the Wild West, Roosevelt led the charge.')
    ).toBeTruthy()
  })

  it('renders story reader aria label', () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={null}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    expect(
      screen.getByRole('main', { name: 'Adventures With The Bull — story reader' })
    ).toBeTruthy()
  })

  it('renders panel image caption when present', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        coverImagePortrait={null}
        body={[PANEL_IMAGE_BLOCK_2]}
      />
    )
    expect(screen.getByText('A historic moment')).toBeTruthy()
  })

  it('renders empty body gracefully', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        coverImagePortrait={null}
        body={[]}
      />
    )
    expect(document.querySelector('.story-reader')).toBeTruthy()
  })
})
