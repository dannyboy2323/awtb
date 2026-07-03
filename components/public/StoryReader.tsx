'use client'

/**
 * StoryReader
 *
 * Full story reading experience with automatic content pagination.
 *
 * ─── PORTRAIT / MOBILE ───────────────────────────────────────────
 * Cover fills 100dvh × 100dvw (9:16 variant via CSS).
 * All story body content scrolls below in a single continuous column.
 * No pagination — content never clips.
 * Rendered immediately (SSR-safe, no client-side JS needed for layout).
 *
 * ─── LANDSCAPE / DESKTOP ─────────────────────────────────────────
 * Cover takes the LEFT half of the first journal spread.
 * Body content is automatically paginated into landscape page heights:
 *
 *   Spread 0:  Cover (left)   │ Page 1 (right)
 *   Spread 1:  Page 2 (left)  │ Page 3 (right)
 *   Spread 2:  Page 4 (left)  │ Page 5 (right)
 *   …
 *
 * Pagination uses real DOM measurement so content NEVER clips:
 *  - All blocks render in a hidden measurement container sized to an
 *    actual page content area (same width, font, line-height).
 *  - After first paint, each block's offsetHeight is read.
 *  - Blocks are packed into pages until the target height would be exceeded.
 *  - Re-paginates on window resize (debounced 300ms).
 *
 * Images in landscape mode use block (non-float) layout so measurement
 * is accurate and narrow half-page columns look clean. Portrait mode
 * keeps the float layout for full-width aesthetic.
 *
 * ─── SCHEMA CHANGE ───────────────────────────────────────────────
 * Replaces the manual `pages[]` array with a single `body` Portable Text
 * field. Paste all story text at once, then insert panelImage blocks.
 *
 * ─── MIGRATION ───────────────────────────────────────────────────
 * Existing story content in `pages[]` must be manually re-pasted into
 * the new `body` field in Sanity Studio. One-time step per story.
 */

import React, {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from 'react'
import Image from 'next/image'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { useOrientation } from '@/hooks/useOrientation'
import { usePagination } from '@/hooks/usePagination'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CoverImageAsset {
  asset: {
    url: string
    _id: string
    metadata?: { dimensions?: { width: number; height: number } } | null
  } | null
  alt?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BodyBlock = Record<string, any>

export interface StoryReaderProps {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  /** Full story body as a flat Portable Text block array */
  body: BodyBlock[] | null
}

export interface LightboxImage {
  url: string
  alt: string
  width: number
  height: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox context — shared between StoryReader and nested image components
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxContextValue {
  openLightbox: (img: LightboxImage) => void
}

export const LightboxContext = createContext<LightboxContextValue>({
  openLightbox: () => {},
})

export function useLightbox() {
  return useContext(LightboxContext)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox overlay
// ─────────────────────────────────────────────────────────────────────────────

function Lightbox({
  image,
  onClose,
}: {
  image: LightboxImage | null
  onClose: () => void
}) {
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
// Cover page — renders both images; CSS shows the correct one per orientation
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
          {/* Landscape / square cover — hidden in portrait via CSS */}
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
          {/* Portrait / 9:16 cover — hidden in landscape via CSS */}
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
// Portable Text component definitions
// Two variants: render (for display) and measure (for hidden container)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PanelImageBlock — the shape of a panelImage block from Sanity
 */
interface PanelImageBlock {
  _type: 'panelImage'
  _key: string
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

/**
 * PanelImageRenderer — proper React component (capitalized) for panelImage blocks.
 * Extracted from the PortableText component map so useContext can be called legally.
 */
function PanelImageRenderer({
  value: block,
  landscapeMode,
}: {
  value: PanelImageBlock
  landscapeMode: boolean
}) {
  const { openLightbox } = useContext(LightboxContext)
  const asset = block.image?.asset
  const imageUrl = asset?.url ? `${asset.url}?auto=format&fm=webp&q=90` : null

  if (!imageUrl) return null

  const dims = asset?.metadata?.dimensions
  const width = dims?.width ?? 280
  const height = dims?.height ?? 280
  const altText = block.alt ?? 'Panel illustration'
  const alignClass = landscapeMode
    ? 'inline-panel--center'
    : `inline-panel--${block.alignment ?? 'left'}`

  return (
    <figure
      role="group"
      className={`inline-panel ${alignClass}`}
    >
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
          sizes={landscapeMode ? '(max-width: 1200px) 40vw, 280px' : '(max-width: 700px) 100vw, 280px'}
          loading="lazy"
        />
        <span className="inline-panel-zoom-hint" aria-hidden="true">🔍</span>
      </button>
      {block.caption && (
        <figcaption className="inline-panel-caption">{block.caption}</figcaption>
      )}
    </figure>
  )
}

/**
 * makeRenderComponents — full interactive rendering with lightbox support.
 * Used for both portrait continuous body and landscape page rendering.
 *
 * @param landscapeMode  When true, images use block layout (no floats)
 *                       for accurate pagination and clean narrow columns.
 */
function makeRenderComponents(landscapeMode: boolean): PortableTextComponents {
  return {
    types: {
      panelImage: ({ value }) => (
        <PanelImageRenderer value={value as PanelImageBlock} landscapeMode={landscapeMode} />
      ),
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

/**
 * makeMeasureComponents — lightweight components for the hidden measurement
 * container. Images are replaced by fixed-height placeholder divs computed
 * from Sanity asset metadata so async image loading doesn't affect accuracy.
 */
function makeMeasureComponents(pageContentWidth: number): PortableTextComponents {
  return {
    types: {
      panelImage: ({ value }) => {
        const block = value as PanelImageBlock
        const dims = block.image?.asset?.metadata?.dimensions

        // For 1:1 images (square), height = width. For other ratios, scale.
        // Images are centered (block) in landscape, max ~40% of page width.
        const aspectRatio = dims ? dims.height / dims.width : 1
        const imgW = Math.min(pageContentWidth * 0.4, 280)
        const imgH = imgW * aspectRatio
        const captionH = block.caption ? 20 : 0
        const totalH = imgH + captionH + 24 // +24 for figure padding/margin

        return (
          <div
            style={{ height: totalH, display: 'block' }}
            aria-hidden="true"
          />
        )
      },
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
// Prose content renderer — wraps PortableText in .prose-body
// ─────────────────────────────────────────────────────────────────────────────

function ProseContent({
  blocks,
  landscapeMode,
}: {
  blocks: BodyBlock[]
  landscapeMode: boolean
}) {
  const components = makeRenderComponents(landscapeMode)

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
// Portrait layout — cover + single scrolling column for all body content
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
      {/* Cover spread — full viewport height in portrait via CSS */}
      <section className="journal-spread" aria-label="Cover">
        <div className="journal-book journal-book--cover">
          <CoverPage
            coverImage={coverImage}
            coverImagePortrait={coverImagePortrait}
            title={title}
          />
          {/* Spine + right page hidden in portrait via CSS */}
          <div className="journal-spine" aria-hidden="true" />
          <div className="journal-page journal-page--right" aria-hidden="true" />
        </div>
      </section>

      {/* Body content — continuous scroll, no page breaks */}
      {body.length > 0 && (
        <section className="journal-spread" aria-label="Story content">
          <div className="journal-book">
            <div className="journal-page journal-page--portrait-body">
              <ProseContent blocks={body} landscapeMode={false} />
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Landscape layout — paginated spreads
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
  // Build spreads:
  // Spread 0: Cover (left) | Page 0 (right)
  // Spread 1: Page 1 (left) | Page 2 (right)
  // Spread 2: Page 3 (left) | Page 4 (right)
  // ...
  const spreads: Array<{
    left: 'cover' | BodyBlock[]
    right: BodyBlock[] | null
    pageNumLeft: number
    pageNumRight: number
  }> = []

  spreads.push({
    left: 'cover',
    right: pages[0] ?? null,
    pageNumLeft: 0,
    pageNumRight: 1,
  })

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
      {spreads.map((spread, spreadIdx) => {
        const isFirstSpread = spreadIdx === 0

        return (
          <section
            key={spreadIdx}
            className="journal-spread"
            aria-label={`Spread ${spreadIdx + 1}`}
          >
            <div className={`journal-book${isFirstSpread ? ' journal-book--cover' : ''}`}>
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
                  <ProseContent blocks={spread.left} landscapeMode={true} />
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
                    <ProseContent blocks={spread.right} landscapeMode={true} />
                  </>
                ) : (
                  <div className="journal-page--blank" aria-hidden="true" />
                )}
              </div>
            </div>
          </section>
        )
      })}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main StoryReader component
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

  // Page content dimensions — updated from actual viewport on mount/resize
  const [pageContentHeight, setPageContentHeight] = useState(600) // SSR-safe default
  const [pageContentWidth, setPageContentWidth] = useState(400)  // SSR-safe default

  useEffect(() => {
    const updateDimensions = () => {
      // Content height = viewport height minus page top/bottom padding (2.5rem + 3rem ≈ 88px)
      setPageContentHeight(window.innerHeight - 88)
      // Content width = half viewport minus page left/right padding (2 × 2.5rem ≈ 80px)
      setPageContentWidth(window.innerWidth / 2 - 80)
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const blocks = body ?? []

  // Paginate only in landscape mode
  const { pages, measureRef, isReady } = usePagination(
    blocks,
    pageContentHeight,
    isLandscape
  )

  const measureComponents = makeMeasureComponents(pageContentWidth)

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      <div className="story-reader">
        {/*
         * Hidden measurement container — always rendered in DOM so
         * usePagination can measure block heights. Invisible and non-interactive.
         * Sized to one page column's content area.
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
            // Match actual page font/spacing for accurate measurement
            fontFamily: "'Lora', 'Georgia', 'Times New Roman', serif",
            fontSize: '1.0625rem',
            lineHeight: '1.85',
            padding: '0',
          }}
        >
          {blocks.map((block, i) => (
            // Each block is its own child so we can read offsetHeight individually
            <div key={block._key ?? i}>
              <PortableText value={[block]} components={measureComponents} />
            </div>
          ))}
        </div>

        {/* Main content — portrait until landscape pagination is ready */}
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
