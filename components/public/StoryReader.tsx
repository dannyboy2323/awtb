'use client'

/**
 * StoryReader
 *
 * Renders the full story reading experience for the graphic-novel reader.
 *
 * LAYOUT
 * ───────────────────────────────────────────────────────────────────────────
 * PORTRAIT (known-good, unchanged)
 *   A single journal spread: cover fills 100dvh, then the entire body flows
 *   below in one naturally-scrolling column.
 *
 * LANDSCAPE (book pagination)
 *   Body split into 100vh page fragments laid out as discrete book spreads:
 *     Spread 1: [ cover ][spine][ body page 1 ]
 *     Spread 2: [ body page 2 ][spine][ body page 3 ]  …
 *
 *   Every page is measured via getBoundingClientRect() (sub-pixel accurate).
 *   A PAGE_SAFETY_BUFFER_PX margin absorbs rounding drift so pages never clip.
 *   Each rendered page is overflow:hidden — content can NEVER spill over the
 *   cover art or the next spread.
 *
 * KEY FIXES (punch-list)
 * ───────────────────────────────────────────────────────────────────────────
 * Item 2  – Lightbox opens full-resolution asset (fit=max, q=95).
 * Item 3+4– getBoundingClientRect() + PAGE_SAFETY_BUFFER_PX eliminate clipping
 *           and content loss. normalizeBlocks() prevents keyIndex Map collisions
 *           caused by duplicate _key values from the pages[]→body migration,
 *           which was silently dropping all content past the first duplicate
 *           (manifested as story stopping after page 9).
 *
 * PROGRESSIVE ENHANCEMENT
 * ───────────────────────────────────────────────────────────────────────────
 * SSR / no-JS renders the single non-paginated spread (fully functional in
 * both orientations). Landscape pagination is a client-only enhancement
 * applied after mount once real element heights and web fonts are known.
 */

import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  createContext,
} from 'react'
import Image from 'next/image'
import { PortableText, PortableTextComponents } from '@portabletext/react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Cover image asset from a Sanity image field. */
export interface CoverImageAsset {
  asset: {
    url: string
    _id: string
    metadata?: { dimensions?: { width: number; height: number } } | null
  } | null
  alt?: string | null
}

/** A single Portable Text block from the Sanity body field. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BodyBlock = Record<string, any>

/** Props accepted by the StoryReader component. */
export interface StoryReaderProps {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  /** Full story body as a flat Portable Text block array from Sanity. */
  body: BodyBlock[] | null
}

/** Data passed to the lightbox when a panel image is clicked. */
export interface LightboxImage {
  url: string
  alt: string
  width: number
  height: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safety margin (px) subtracted from available page height during pagination.
 * Prevents sub-pixel rounding from clipping the last block on a page. 28 px ≈
 * one prose line — conservative but invisible to the reader.
 */
const PAGE_SAFETY_BUFFER_PX = 28

// ─────────────────────────────────────────────────────────────────────────────
// normalizeBlocks
//
// Guarantees every block has a globally unique `_key` regardless of Sanity
// migration state. Duplicate or missing keys (which occur when content is
// migrated from `pages[]` to a flat `body` array) cause the key→block Map to
// silently drop earlier blocks, which presents as story content stopping
// mid-way through. Re-keying as `blk-{index}-{original}` prevents that.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-key every block so keys are guaranteed unique for a given body snapshot.
 *
 * @param blocks Raw Portable Text blocks from Sanity.
 * @returns A new array with `_key` replaced by `blk-{i}-{original}`.
 */
export function normalizeBlocks(blocks: BodyBlock[]): BodyBlock[] {
  return blocks.map((block, index) => {
    const original = typeof block?._key === 'string' ? block._key : 'nokey'
    return { ...block, _key: `blk-${index}-${original}` }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox context — avoids prop-drilling through the PortableText component map
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxContextValue {
  openLightbox: (img: LightboxImage) => void
}

export const LightboxContext = createContext<LightboxContextValue>({
  openLightbox: () => {},
})

/** Hook for nested components to open the lightbox. */
export function useLightbox() {
  return useContext(LightboxContext)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox overlay
// ─────────────────────────────────────────────────────────────────────────────

function Lightbox({ image, onClose }: { image: LightboxImage | null; onClose: () => void }) {
  // Close on Escape — accessible alternative to overlay click and close button.
  useEffect(() => {
    if (!image) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [image, onClose])

  if (!image) return null

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close image">
          ✕
        </button>
        {/* Full-resolution image: fit=max serves native dimensions without cropping. */}
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="lightbox-image"
          sizes="90vw"
          quality={95}
          priority
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CoverPage — renders both orientation cover images; CSS toggles which is shown
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
          {/* Square / landscape cover — hidden in portrait by CSS */}
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
          {/* 9:16 portrait cover — hidden in landscape by CSS */}
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
// PanelImageBlock — shape of an inline panelImage block from Sanity
// ─────────────────────────────────────────────────────────────────────────────

interface PanelImageBlock {
  _type: 'panelImage'
  _key: string
  /** Drives the CSS float class — left, right, center, or full. */
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
// Capitalized so React hook rules are satisfied (useContext is called inside).
// Always uses block.alignment — no orientation-based override ever.
// The figure carries data-key so the landscape paginator can assign it to a page.
//
// Thumbnail display uses q=90 WebP for fast inline load.
// Lightbox receives a separate full-resolution URL (fit=max, q=95) — the viewer
// sees the original uncompressed image at native dimensions.
// ─────────────────────────────────────────────────────────────────────────────

function PanelImageRenderer({ value: block }: { value: PanelImageBlock }) {
  const { openLightbox } = useContext(LightboxContext)

  const asset = block.image?.asset
  /** Optimised WebP thumbnail for inline display. */
  const imageUrl = asset?.url ? `${asset.url}?auto=format&fm=webp&q=90` : null
  /** Full-resolution URL for the lightbox — fit=max preserves native dimensions. */
  const fullUrl = asset?.url ? `${asset.url}?auto=format&fit=max&q=95` : null

  if (!imageUrl || !fullUrl) return null

  const dims = asset?.metadata?.dimensions
  const width = dims?.width ?? 280
  const height = dims?.height ?? 280
  const altText = block.alt ?? 'Panel illustration'
  const alignClass = `inline-panel--${block.alignment ?? 'left'}`

  return (
    <figure role="group" data-key={block._key} className={`inline-panel ${alignClass}`}>
      <button
        className="inline-panel-btn"
        aria-label={`View full size: ${altText}`}
        title="Click to enlarge"
        onClick={() => openLightbox({ url: fullUrl, alt: altText, width, height })}
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
// makeComponents — PortableText component map
//
// Every top-level element carries data-key so the paginator can assign blocks to
// pages without relying on positional indices (which drift if a block renders
// nothing).
// ─────────────────────────────────────────────────────────────────────────────

function makeComponents(): PortableTextComponents {
  return {
    types: {
      panelImage: ({ value }) => <PanelImageRenderer value={value as PanelImageBlock} />,
    },
    block: {
      normal: ({ children, value }) => (
        <p className="prose-paragraph" data-key={(value as BodyBlock)?._key}>
          {children}
        </p>
      ),
      h2: ({ children, value }) => (
        <h2 className="prose-h2" data-key={(value as BodyBlock)?._key}>
          {children}
        </h2>
      ),
      h3: ({ children, value }) => (
        <h3 className="prose-h3" data-key={(value as BodyBlock)?._key}>
          {children}
        </h3>
      ),
      blockquote: ({ children, value }) => (
        <blockquote className="prose-blockquote" data-key={(value as BodyBlock)?._key}>
          {children}
        </blockquote>
      ),
    },
    marks: {
      strong: ({ children }) => <strong className="prose-strong">{children}</strong>,
      em: ({ children }) => <em className="prose-em">{children}</em>,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Spread model
// ─────────────────────────────────────────────────────────────────────────────

type Spread =
  | { kind: 'cover'; rightKeys: string[]; rightPageNo: number }
  | {
      kind: 'text'
      leftKeys: string[]
      leftPageNo: number
      rightKeys: string[] | null
      rightPageNo: number | null
    }

/**
 * Maps an ordered page key-group array onto book spreads.
 * Page 1 sits right of the cover; remaining pages pair left/right;
 * an odd final page leaves a blank right-hand page.
 */
function buildSpreads(pages: string[][]): Spread[] {
  const spreads: Spread[] = []
  let pageNo = 1

  spreads.push({ kind: 'cover', rightKeys: pages[0] ?? [], rightPageNo: pageNo++ })

  for (let i = 1; i < pages.length; i += 2) {
    const leftKeys = pages[i]
    const leftPageNo = pageNo++
    let rightKeys: string[] | null = null
    let rightPageNo: number | null = null
    if (i + 1 < pages.length) {
      rightKeys = pages[i + 1]
      rightPageNo = pageNo++
    }
    spreads.push({ kind: 'text', leftKeys, leftPageNo, rightKeys, rightPageNo })
  }

  return spreads
}

// ─────────────────────────────────────────────────────────────────────────────
// useIsLandscape
//
// Tracks viewport orientation via matchMedia.
//   null  = SSR / before first client resolution
//   true  = landscape
//   false = portrait
//
// State updates deferred to rAF to satisfy the react-hooks/set-state-in-effect
// rule and avoid a synchronous render cascade.
// ─────────────────────────────────────────────────────────────────────────────

function useIsLandscape(): boolean | null {
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(orientation: landscape)')
    let raf = 0
    const apply = (matches: boolean) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setIsLandscape(matches))
    }
    apply(mq.matches)
    const onChange = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', onChange)
    return () => {
      cancelAnimationFrame(raf)
      mq.removeEventListener('change', onChange)
    }
  }, [])

  return isLandscape
}

// ─────────────────────────────────────────────────────────────────────────────
// useLandscapePagination
//
// Measurement-driven pagination for the landscape "book" layout.
//
// 1. A hidden measurer renders the entire body at the exact width/padding of a
//    real right-hand page (same CSS classes + paginated panel caps) with
//    height: auto so everything is visible.
// 2. After document.fonts.ready and a paint frame, each top-level block is
//    measured via getBoundingClientRect() (fractional accuracy) and greedily
//    packed into pages whose content height ≤ (pageHeight − padding − buffer).
// 3. The resulting per-page key lists drive the discrete book spreads.
//
// Safety guards:
//   getBoundingClientRect()    → eliminates integer-rounding clipping (items 3+4)
//   PAGE_SAFETY_BUFFER_PX      → absorbs sub-pixel drift
//   unsafe flag                → if any child lacks data-key, fall back to
//                                SingleSpread rather than silently drop content
//   normalizeBlocks() (caller) → prevents keyIndex Map collisions from duplicate
//                                _key values (was causing content loss after pg 9)
// ─────────────────────────────────────────────────────────────────────────────

function useLandscapePagination(
  blocks: BodyBlock[],
  enabled: boolean
): {
  measurerRef: React.RefObject<HTMLDivElement | null>
  pages: string[][] | null
  unsafe: boolean
} {
  const measurerRef = useRef<HTMLDivElement | null>(null)
  const [pages, setPages] = useState<string[][] | null>(null)
  const [unsafe, setUnsafe] = useState(false)

  useEffect(() => {
    if (!enabled || blocks.length === 0) {
      const raf = requestAnimationFrame(() => {
        setPages((prev) => (prev === null ? prev : null))
        setUnsafe(false)
      })
      return () => cancelAnimationFrame(raf)
    }

    let raf = 0

    const measure = () => {
      const root = measurerRef.current
      if (!root) return
      const page = root.querySelector('.journal-page--right') as HTMLElement | null
      const proseBody = root.querySelector('.prose-body') as HTMLElement | null
      if (!page || !proseBody) return

      const cs = window.getComputedStyle(page)
      const padTop = parseFloat(cs.paddingTop) || 0
      const padBottom = parseFloat(cs.paddingBottom) || 0
      const pageHeight = page.getBoundingClientRect().height
      const available = pageHeight - padTop - padBottom - PAGE_SAFETY_BUFFER_PX

      const proseBodyTop = proseBody.getBoundingClientRect().top
      const children = Array.from(proseBody.children) as HTMLElement[]

      // Safety: unhandled Sanity block type → fall back to scrollable SingleSpread.
      const hasUnsafeBlock = children.some((el) => !el.getAttribute('data-key'))
      if (hasUnsafeBlock) {
        setUnsafe(true)
        setPages([]) // non-null → measurer unmounts so we don't loop
        return
      }

      const measured = children.map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          key: el.getAttribute('data-key') as string,
          top: rect.top - proseBodyTop,
          height: rect.height,
        }
      })

      if (measured.length === 0 || available <= 0) {
        setPages([measured.map((m) => m.key)])
        return
      }

      // Greedy pack: block joins current page while (first-top → block-bottom) ≤ available.
      const result: string[][] = []
      let current: string[] = []
      let startTop = measured[0].top

      for (const m of measured) {
        const bottom = m.top + m.height
        if (current.length > 0 && bottom - startTop > available) {
          result.push(current)
          current = [m.key]
          startTop = m.top
        } else {
          current.push(m.key)
        }
      }
      if (current.length > 0) result.push(current)

      setUnsafe(false)
      setPages(result)
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    const runAfterFonts = () => {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(schedule).catch(schedule)
      } else {
        schedule()
      }
    }

    const onResize = () => {
      setPages(null)
      setUnsafe(false)
      runAfterFonts()
    }

    runAfterFonts()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [enabled, blocks])

  return { measurerRef, pages, unsafe }
}

// ─────────────────────────────────────────────────────────────────────────────
// SingleSpread — portrait fallback and pre-pagination placeholder
// ─────────────────────────────────────────────────────────────────────────────

function SingleSpread({
  title,
  coverImage,
  coverImagePortrait,
  blocks,
  components,
}: {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  blocks: BodyBlock[]
  components: PortableTextComponents
}) {
  return (
    <section className="journal-spread" aria-label="Spread 1">
      <div className="journal-book journal-book--cover">
        <CoverPage coverImage={coverImage} coverImagePortrait={coverImagePortrait} title={title} />
        <div className="journal-spine" aria-hidden="true" />
        <div className="journal-page journal-page--right">
          <div className="prose-body">
            {blocks.length > 0 ? (
              <PortableText value={blocks} components={components} />
            ) : (
              <p className="prose-placeholder">No content yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StoryReader — main export
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

  // Normalize keys before any use — prevents duplicate-key Map collisions.
  const blocks = useMemo<BodyBlock[]>(() => normalizeBlocks(body ?? []), [body])
  const components = useMemo(() => makeComponents(), [])

  // key → block lookup for rendering individual pages from measured key-groups.
  const keyIndex = useMemo(() => {
    const map = new Map<string, BodyBlock>()
    for (const block of blocks) {
      const key = block?._key
      if (typeof key === 'string') map.set(key, block)
    }
    return map
  }, [blocks])

  const isLandscape = useIsLandscape()
  const paginate = isLandscape === true && blocks.length > 0
  const { measurerRef, pages, unsafe } = useLandscapePagination(blocks, paginate)

  const renderKeys = useCallback(
    (keys: string[]) => {
      const slice = keys.map((key) => keyIndex.get(key)).filter((b): b is BodyBlock => Boolean(b))
      if (slice.length === 0) return null
      return <PortableText value={slice} components={components} />
    },
    [keyIndex, components]
  )

  const spreads = useMemo(() => (pages ? buildSpreads(pages) : []), [pages])

  // Show paginated layout only when pagination is complete, non-empty, and safe.
  const showPaginated = paginate && pages !== null && spreads.length > 0 && !unsafe

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      <div className="story-reader">
        <main className="story-content" role="main" aria-label={`${title} — story reader`}>
          {showPaginated ? (
            spreads.map((spread, index) =>
              spread.kind === 'cover' ? (
                <section
                  key={`spread-${index}`}
                  className="journal-spread"
                  aria-label={`Spread ${index + 1}`}
                >
                  <div className="journal-book journal-book--cover">
                    <CoverPage
                      coverImage={coverImage}
                      coverImagePortrait={coverImagePortrait}
                      title={title}
                    />
                    <div className="journal-spine" aria-hidden="true" />
                    <div className="journal-page journal-page--right journal-page--paginated">
                      <div className="prose-body">{renderKeys(spread.rightKeys)}</div>
                      <span className="page-number page-number--right">{spread.rightPageNo}</span>
                    </div>
                  </div>
                </section>
              ) : (
                <section
                  key={`spread-${index}`}
                  className="journal-spread"
                  aria-label={`Spread ${index + 1}`}
                >
                  <div className="journal-book">
                    <div className="journal-page journal-page--left journal-page--paginated">
                      <div className="prose-body">{renderKeys(spread.leftKeys)}</div>
                      <span className="page-number page-number--left">{spread.leftPageNo}</span>
                    </div>
                    <div className="journal-spine" aria-hidden="true" />
                    {spread.rightKeys ? (
                      <div className="journal-page journal-page--right journal-page--paginated">
                        <div className="prose-body">{renderKeys(spread.rightKeys)}</div>
                        <span className="page-number page-number--right">{spread.rightPageNo}</span>
                      </div>
                    ) : (
                      <div
                        className="journal-page journal-page--right journal-page--blank"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </section>
              )
            )
          ) : (
            <SingleSpread
              title={title}
              coverImage={coverImage}
              coverImagePortrait={coverImagePortrait}
              blocks={blocks}
              components={components}
            />
          )}

          {/*
           * Hidden measurer — mounted only while landscape pagination is pending
           * (paginate=true, pages=null, unsafe=false). Renders entire body at
           * real right-page width/padding + paginated panel caps so measured
           * heights exactly match the live layout.
           */}
          {paginate && pages === null && !unsafe && (
            <div
              ref={measurerRef}
              className="story-reader story-reader--measurer"
              aria-hidden="true"
            >
              <div className="journal-book journal-book--cover" style={{ height: 'auto' }}>
                <div className="journal-page journal-page--cover" />
                <div className="journal-spine" />
                <div
                  className="journal-page journal-page--right journal-page--paginated"
                  style={{ overflow: 'visible', height: 'auto' }}
                >
                  <div className="prose-body">
                    <PortableText value={blocks} components={components} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <Lightbox image={lightboxImage} onClose={closeLightbox} />
      </div>
    </LightboxContext.Provider>
  )
}
