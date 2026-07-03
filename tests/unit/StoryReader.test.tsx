/**
 * StoryReader unit tests
 *
 * Tests the simplified StoryReader component which uses a single layout
 * (CSS-only orientation handling, no JS landscape/portrait switching,
 * no pagination). Tests verify rendering, lightbox behaviour, and that
 * inline panels always use their Sanity alignment field.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StoryReader from '@/components/public/StoryReader'

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
// Test fixtures
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

const PANEL_LEFT = {
  _type: 'panelImage',
  _key: 'panel-left',
  alignment: 'left' as const,
  alt: 'Panel left illustration',
  caption: null,
  image: {
    asset: {
      _id: 'panel-left-asset',
      url: 'https://cdn.sanity.io/images/test/production/panel-left.webp',
      metadata: { dimensions: { width: 280, height: 280 } },
    },
  },
}

const PANEL_RIGHT = {
  _type: 'panelImage',
  _key: 'panel-right',
  alignment: 'right' as const,
  alt: 'Panel right illustration',
  caption: 'A caption',
  image: {
    asset: {
      _id: 'panel-right-asset',
      url: 'https://cdn.sanity.io/images/test/production/panel-right.webp',
      metadata: { dimensions: { width: 280, height: 280 } },
    },
  },
}

const TEXT_BLOCK = {
  _type: 'block',
  _key: 'text-1',
  style: 'normal',
  children: [{ _type: 'span', _key: 'span-1', text: 'Story prose text goes here.', marks: [] }],
  markDefs: [],
}

const SAMPLE_BODY = [PANEL_LEFT, TEXT_BLOCK, PANEL_RIGHT]

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('StoryReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <StoryReader
        title="Test Story"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={SAMPLE_BODY}
      />
    )
    expect(document.querySelector('.story-reader')).toBeTruthy()
  })

  it('renders the story-content main element with accessible label', () => {
    render(<StoryReader title="Adventures" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(screen.getByRole('main', { name: 'Adventures — story reader' })).toBeTruthy()
  })

  it('renders landscape cover image', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={[]}
      />
    )
    expect(screen.getAllByAltText('Story cover art')[0]).toBeTruthy()
  })

  it('renders portrait cover image', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={COVER_IMAGE}
        coverImagePortrait={PORTRAIT_COVER}
        body={[]}
      />
    )
    expect(screen.getAllByAltText('Story cover art portrait')[0]).toBeTruthy()
  })

  it('falls back to landscape cover when no portrait image provided', () => {
    render(
      <StoryReader title="Test" coverImage={COVER_IMAGE} coverImagePortrait={null} body={[]} />
    )
    // Landscape image renders (used as fallback for portrait slot too)
    expect(screen.getAllByAltText('Story cover art').length).toBeGreaterThanOrEqual(1)
  })

  it('renders cover placeholder title when no cover image', () => {
    render(<StoryReader title="My Story" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(document.querySelector('.cover-placeholder')).toBeTruthy()
    expect(document.querySelector('.cover-title')?.textContent).toBe('My Story')
  })

  it('renders body prose text', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={SAMPLE_BODY} />
    )
    expect(screen.getByText('Story prose text goes here.')).toBeTruthy()
  })

  it('renders left-aligned panel with correct CSS class', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    expect(document.querySelector('.inline-panel--left')).toBeTruthy()
    expect(document.querySelector('.inline-panel--right')).toBeFalsy()
  })

  it('renders right-aligned panel with correct CSS class', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[PANEL_RIGHT]} />
    )
    expect(document.querySelector('.inline-panel--right')).toBeTruthy()
    expect(document.querySelector('.inline-panel--left')).toBeFalsy()
  })

  it('renders panel caption when present', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[PANEL_RIGHT]} />
    )
    expect(screen.getByText('A caption')).toBeTruthy()
  })

  it('renders placeholder text when body is empty', () => {
    render(<StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[]} />)
    expect(screen.getByText('No content yet.')).toBeTruthy()
  })

  it('renders placeholder text when body is null', () => {
    render(<StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={null} />)
    expect(screen.getByText('No content yet.')).toBeTruthy()
  })

  it('opens lightbox when a panel image button is clicked', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    const btn = screen.getByRole('button', { name: 'View full size: Panel left illustration' })
    fireEvent.click(btn)
    expect(document.querySelector('.lightbox-overlay')).toBeTruthy()
  })

  it('closes lightbox when overlay background is clicked', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Panel left illustration' }))
    expect(document.querySelector('.lightbox-overlay')).toBeTruthy()

    fireEvent.click(document.querySelector('.lightbox-overlay')!)
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })

  it('closes lightbox when the close button is clicked', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={[PANEL_LEFT]} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'View full size: Panel left illustration' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close image' }))
    expect(document.querySelector('.lightbox-overlay')).toBeFalsy()
  })

  it('renders .journal-page--body class on the body page', () => {
    render(
      <StoryReader title="Test" coverImage={null} coverImagePortrait={null} body={SAMPLE_BODY} />
    )
    expect(document.querySelector('.journal-page--body')).toBeTruthy()
  })

  it('renders single journal-spread section', () => {
    render(
      <StoryReader
        title="Test"
        coverImage={COVER_IMAGE}
        coverImagePortrait={null}
        body={SAMPLE_BODY}
      />
    )
    expect(document.querySelectorAll('.journal-spread').length).toBe(1)
  })
})
