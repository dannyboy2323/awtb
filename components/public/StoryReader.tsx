'use client'

/**
 * StoryReader
 *
 * Full story reading experience with automatic content pagination.
 *
 * ─── PORTRAIT / MOBILE ───────────────────────────────────────────
 * Cover fills 100dvh (9:16 variant shown via CSS orientation rules).
 * All story body content scrolls below as a single continuous column.
 * No pagination needed — content flows naturally and never clips.
 * Rendered immediately on SSR — no client-side JS required for layout.
 *
 * ─── LANDSCAPE / DESKTOP ─────────────────────────────────────────
 * Journal spread layout — cover on left, story pages on right and left
 * alternating as the user scrolls. Each spread is exactly 100vh so the
 * background image tiles correctly.
 *
 *   Spread 0:  Cover (left)   │ Page 1 (right)
 *   Spread 1:  Page 2 (left)  │ Page 3 (right)
 *   Spread 2:  Page 4 (left)  │ Page 5 (right)
 *   …
 *
 * Content is paginated using DOM measurement: all blocks render in a
 * hidden container sized to one page column, heights are read after
 * first paint, and blocks are packed into pages until the target height
 * is reached. Re-paginates on window resize (debounced 300ms).
 *
 * ─── INLINE PANEL IMAGES ─────────────────────────────────────────
 * Panel images ALWAYS use their Sanity `alignment` field (left/right/center)
 * in BOTH portrait and landscape. There is NO landscapeMode override.
 * CSS float rules in .inline-panel--left / .inline-panel--right handle
 * text wrap automatically in all orientations. This matches how portrait
 * renders, which is the known-good baseline.
 *
 * ─── SCHEMA ──────────────────────────────────────────────────────
 * Uses a single `body` Portable Text field replacing the old manual
 * pages[] array. Paste all story text at once, then insert panelImage
 * blocks inline. The reader auto-paginates for landscape view.
 */

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react'
import Image from 'next/image'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { useOrientation } from '@/hooks/useOrientation'
import { usePagination } from '@/hooks/usePagination'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Cover image asset from Sanity with URL and optional alt text. */
export interface CoverImageAsset {
  asset: {
    url: string
    _id: string
    metadata?: { dimensions?: { width: number; height: number } } | null
  } | null
  alt?: string | null
}

/** A single Portable Text block from Sanity body field. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BodyBlock = Record<string, any>

/** Props for the StoryReader component. */
export interface StoryReaderProps {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  /** Full story body as a flat Portable Text block array from Sanity. */
  body: BodyBlock[] | null
}

/** Image data passed to the lightbox when a panel is clicked. */
export interface LightboxImage {
  url: string
  alt: string
  width: number
  height: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox context — lets nested PanelImageRenderer open the lightbox
// without prop-drilling through PortableText component maps.
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxContextValue {
  openLightbox: (img: LightboxImage) => void
}

export const LightboxContext = createContext<LightboxContextValue>({
  openLightbox: () => {},
})

/** Hook to access the lightbox opener from any nested component. */
export function useLightbox() {
  return useContext(LightboxContext)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox overlay
// ─────────────────────────────────────────────────────────────────────────────

function Lightbox({ image, onClose }: { image: LightboxImage | null; onClose: () => void }) {
  if (!image) return null

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close image">
          ✕
        </button>
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="lightbox-image"
          priority
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Cover page
// Renders both landscape (square) and portrait (9:16) cover images.
// CSS orientation rules show/hide the appropriate one.
// ─────────────────────────────────────────────────────────────────────────────

function CoverPage({
  coverImage,
  coverImagePortrait,
  title,
}: {
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  title: string
}) {
  const landscapeUrl = coverImage?.asset?.url
    ? `${coverImage.asset.url}?auto=format&fm=webp&q=90`
    : null

  const portraitUrl = coverImagePortrait?.asset?.url
    ? `${coverImagePortrait.asset.url}?auto=format&fm=webp&q=90`
    : landscapeUrl

  const altText = coverImage?.alt ?? `${title} cover`

  return (
    <div className="journal-page journal-page--cover" aria-label="Cover">
      {landscapeUrl ? (
        <div className="cover-image-wrap">
          {/* Landscape square cover — CSS hides this in portrait orientation */}
          <Image
            src={landscapeUrl}
            alt={altText}
            width={1200}
            height={1200}
            className="cover-image cover-image--landscape"
            sizes="50vw"
            priority
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
          />
          {/* Portrait 9:16 cover — CSS hides this in landscape orientation */}
          {portraitUrl && (
            <Image
              src={portraitUrl}
              alt={coverImagePortrait?.alt ?? altText}
              width={1080}
              height={1920}
              className="cover-image cover-image--portrait"
              sizes="100vw"
              priority
              style={{ width: '100%', height: '100%', objectFit: 'fill' }}
            />
          )}
        </div>
      ) : (
        <div className="cover-placeholder">
          <span className="cover-title">{title}</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PanelImageBlock type — the shape of an inline panelImage block from Sanity
// ─────────────────────────────────────────────────────────────────────────────

interface PanelImageBlock {
  _type: 'panelImage'
  _key: string
  /** The Sanity-selected alignment for this panel. Drives CSS float class. */
  alignment?: 'left' | 'right' | 'center' | 'full'
  alt?: string | null
  caption?: string | null
  image?: {
    asset?: {
      url?: string
      _id?: string
      metadata?: { dimensions?: { width: number; height: number } } | null
    } | null
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// PanelImageRenderer
//
// Capitalized so React hook rules are satisfied (useContext called here).
// ALWAYS uses block.alignment to determine the CSS class — there is no
// landscapeMode override. This is intentional and matches how portrait
// mode works. The CSS float rules (.inline-panel--left, .inline-panel--right)
// handle text wrap in all orientations identically.
// ─────────────────────────────────────────────────────────────────────────────

function PanelImageRenderer({ value: block }: { value: PanelImageBlock }) {
  const { openLightbox } = useContext(LightboxContext)
  const asset = block.image?.asset
  const imageUrl = asset?.url ? `${asset.url}?auto=format&fm=webp&q=90` : null

  if (!imageUrl) return null

  const dims = asset?.metadata?.dimensions
  const width = dims?.width ?? 280
  const height = dims?.height ?? 280
  const altText = block.alt ?? 'Panel illustration'

  // Always use the block's own alignment field — left, right, center, or full.
  // This drives the CSS float class and is identical in portrait and landscape.
  const alignClass = `inline-panel--${block.alignment ?? 'left'}`

  return (
    <figure role="group" className={`inline-panel ${alignClass}`}>
      <button
        className="inline-panel-btn"
        aria-label={`View full size: ${altText}`}
        title="Click to enlarge"
        onClick={() => openLightbox({ url: imageUrl, alt: altText, width, height })}
      >
        <Image
          src={imageUrl}
          alt={altText}
          width={280}
          height={280}
          className="inline-panel-image"
          sizes="(max-width: 1400px) 25vw, 280px"
          loading="lazy"
        />
        <span className="inline-panel-zoom-hint" aria-hidden="true">
          🔍
        </span>
      </button>
      {block.caption && <figcaption className="inline-panel-caption">{block.caption}</figcaption>}
    </figure>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// makeRenderComponents
//
// Returns the PortableText component map. No parameters — panel alignment
// is always driven by the block's own Sanity field, not by orientation mode.
// These same components are used for both the visible render AND the hidden
// measurement container so measured heights match rendered heights exactly.
// ─────────────────────────────────────────────────────────────────────────────

function makeRenderComponents(): PortableTextComponents {
  return {
    types: {
      panelImage: ({ value }) => <PanelImageRenderer value={value as PanelImageBlock} />,
    },
    block: {
      normal: ({ children }) => <p className="prose-paragraph">{children}</p>,
      h2: ({ children }) => <h2 className="prose-h2">{children}</h2>,
      h3: ({ children }) => <h3 className="prose-h3">{children}</h3>,
      blockquote: ({ children }) => (
        <blockquote className="prose-blockquote">{children}</blockquote>
      ),
    },
    marks: {
      strong: ({ children }) => <strong className="prose-strong">{children}</strong>,
      em: ({ children }) => <em className="prose-em">{children}</em>,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProseContent — renders a block array as Portable Text inside .prose-body
// ─────────────────────────────────────────────────────────────────────────────

function ProseContent({ blocks }: { blocks: BodyBlock[] }) {
  const components = makeRenderComponents()

  return (
    <div className="prose-body">
      {blocks.length > 0 ? (
        <PortableText value={blocks} components={components} />
      ) : (
        <p className="prose-placeholder">No content yet.</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PortraitLayout
//
// Single-column layout: cover (100dvh) followed by all body content as one
// continuous scrolling section. No pagination needed in portrait.
// This is the SSR default and the fallback while landscape pagination loads.
// ─────────────────────────────────────────────────────────────────────────────

function PortraitLayout({
  title,
  coverImage,
  coverImagePortrait,
  body,
}: {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  body: BodyBlock[]
}) {
  return (
    <main className="story-content" role="main" aria-label={`${title} — story reader`}>
      {/* Cover spread */}
      <section className="journal-spread" aria-label="Cover">
        <div className="journal-book journal-book--cover">
          <CoverPage
            coverImage={coverImage}
            coverImagePortrait={coverImagePortrait}
            title={title}
          />
          {/* Spine and right page hidden in portrait via CSS */}
          <div className="journal-spine" aria-hidden="true" />
          <div className="journal-page journal-page--right" aria-hidden="true" />
        </div>
      </section>

      {/* Full body content as one scrolling section */}
      {body.length > 0 && (
        <section className="journal-spread" aria-label="Story content">
          <div className="journal-book">
            <div className="journal-page journal-page--portrait-body">
              <ProseContent blocks={body} />
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LandscapeLayout
//
// Paginated spread layout. Each spread is 100vh, matching the background
// image tile height so the journal background aligns correctly as the user
// scrolls. Pages alternate left/right after the initial cover spread.
// ─────────────────────────────────────────────────────────────────────────────

function LandscapeLayout({
  title,
  coverImage,
  coverImagePortrait,
  pages,
}: {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  pages: BodyBlock[][]
}) {
  // Build spread list:
  // Spread 0: Cover (left) | pages[0] (right)
  // Spread 1: pages[1] (left) | pages[2] (right)
  // Spread 2: pages[3] (left) | pages[4] (right)
  // ...
  const spreads: Array<{
    left: 'cover' | BodyBlock[]
    right: BodyBlock[] | null
    pageNumLeft: number
    pageNumRight: number
  }> = []

  spreads.push({ left: 'cover', right: pages[0] ?? null, pageNumLeft: 0, pageNumRight: 1 })

  for (let i = 1; i < pages.length; i += 2) {
    spreads.push({
      left: pages[i],
      right: pages[i + 1] ?? null,
      pageNumLeft: i + 1,
      pageNumRight: i + 2,
    })
  }

  return (
    <main className="story-content" role="main" aria-label={`${title} — story reader`}>
      {spreads.map((spread, spreadIdx) => (
        <section key={spreadIdx} className="journal-spread" aria-label={`Spread ${spreadIdx + 1}`}>
          <div className={`journal-book${spreadIdx === 0 ? 'journal-book--cover' : ''}`}>
            {/* LEFT PAGE */}
            {spread.left === 'cover' ? (
              <CoverPage
                coverImage={coverImage}
                coverImagePortrait={coverImagePortrait}
                title={title}
              />
            ) : (
              <div className="journal-page journal-page--left">
                <span className="page-number page-number--left" aria-hidden="true">
                  {spread.pageNumLeft}
                </span>
                <ProseContent blocks={spread.left} />
              </div>
            )}

            {/* SPINE */}
            <div className="journal-spine" aria-hidden="true" />

            {/* RIGHT PAGE */}
            <div className="journal-page journal-page--right">
              {spread.right ? (
                <>
                  <span className="page-number page-number--right" aria-hidden="true">
                    {spread.pageNumRight}
                  </span>
                  <ProseContent blocks={spread.right} />
                </>
              ) : (
                <div className="journal-page--blank" aria-hidden="true" />
              )}
            </div>
          </div>
        </section>
      ))}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StoryReader — main component
// ─────────────────────────────────────────────────────────────────────────────

export default function StoryReader({
  title,
  coverImage,
  coverImagePortrait,
  body,
}: StoryReaderProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const openLightbox = useCallback((img: LightboxImage) => setLightboxImage(img), [])
  const closeLightbox = useCallback(() => setLightboxImage(null), [])

  const orientation = useOrientation()
  const isLandscape = orientation === 'landscape'

  // Page content dimensions derived from viewport, updated on resize.
  // These drive both the measurement container sizing and the pagination target.
  const [pageContentHeight, setPageContentHeight] = useState(600) // SSR default
  const [pageContentWidth, setPageContentWidth] = useState(400) // SSR default

  useEffect(() => {
    const update = () => {
      // Height: viewport minus journal-page top+bottom padding (2.5rem + 3rem ≈ 88px)
      setPageContentHeight(window.innerHeight - 88)
      // Width: half viewport minus journal-page left+right padding (2 × 2.5rem ≈ 80px)
      setPageContentWidth(window.innerWidth / 2 - 80)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const blocks = body ?? []

  // Pagination runs only in landscape. Portrait renders all blocks in one column.
  const { pages, measureRef, isReady } = usePagination(blocks, pageContentHeight, isLandscape)

  // Single component map used for BOTH the measurement container and the visible
  // render so measured heights exactly match rendered heights.
  const components = makeRenderComponents()

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      <div className="story-reader">
        {/*
         * Hidden measurement container.
         * Always in the DOM so usePagination can read block heights.
         * Sized and styled to match a real landscape page column.
         * aria-hidden so screen readers ignore it.
         */}
        <div
          ref={measureRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            width: pageContentWidth,
            zIndex: -1,
            top: 0,
            left: 0,
            fontFamily: "'Lora', 'Georgia', 'Times New Roman', serif",
            fontSize: '1.0625rem',
            lineHeight: '1.85',
            padding: '0',
          }}
        >
          {blocks.map((block, i) => (
            // Each block is a direct child so measureRef.current.children[i]
            // corresponds to blocks[i] for offsetHeight reading.
            <div key={block._key ?? i}>
              <PortableText value={[block]} components={components} />
            </div>
          ))}
        </div>

        {/*
         * Render portrait layout until landscape pagination is ready.
         * Portrait layout is the SSR default and loads instantly.
         * Landscape layout renders after the first measurement pass completes
         * (typically one paint cycle — imperceptible to the user).
         */}
        {isLandscape && isReady ? (
          <LandscapeLayout
            title={title}
            coverImage={coverImage}
            coverImagePortrait={coverImagePortrait}
            pages={pages}
          />
        ) : (
          <PortraitLayout
            title={title}
            coverImage={coverImage}
            coverImagePortrait={coverImagePortrait}
            body={blocks}
          />
        )}

        <Lightbox image={lightboxImage} onClose={closeLightbox} />
      </div>
    </LightboxContext.Provider>
  )
}
