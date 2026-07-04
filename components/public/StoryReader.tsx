'use client'

/**
 * StoryReader
 *
 * Renders the full story reading experience for the graphic-novel reader.
 *
 * LAYOUT
 * ───────────────────────────────────────────────────────────────────────────
 * PORTRAIT (unchanged, known-good)
 *   A single journal spread: cover fills 100dvh, then the entire body flows
 *   below in one naturally-scrolling column. No pagination, no JS layout work.
 *   CSS (@media (orientation: portrait)) stacks the grid vertically.
 *
 * LANDSCAPE (book pagination)
 *   The body is split into page-height fragments and laid out as discrete
 *   two-page book spreads that each fill exactly 100vh so the repeating
 *   journal background art stays aligned:
 *
 *     Spread 1: [ cover ][spine][ body page 1 ]
 *     Spread 2: [ body page 2 ][spine][ body page 3 ]  ... etc.
 *
 *   Pages are measured, never estimated (see useLandscapePagination), and
 *   each rendered page is overflow:hidden so content can NEVER spill over
 *   the cover art or the next spread.
 *
 * PROGRESSIVE ENHANCEMENT
 * ───────────────────────────────────────────────────────────────────────────
 * The server-rendered / no-JS output is the single non-paginated spread, which
 * is fully functional in both orientations. Landscape pagination is applied on
 * the client after mount once real element heights (and web fonts) are known.
 *
 * INLINE PANELS
 * ───────────────────────────────────────────────────────────────────────────
 * Panel images always use their Sanity alignment field (left/right/center/
 * full). There is no orientation-based override, so float/text-wrap behaves
 * identically in portrait and landscape. Landscape thumbnail SIZE is capped by
 * the .journal-page--paginated CSS rules; portrait is untouched.
 *
 * Inline thumbnails load an optimised WebP (q=90). The lightbox loads the
 * FULL-RESOLUTION original (fit=max, q=100) at the asset's native pixel
 * dimensions so the enlarged view is never downscaled below the source.
 *
 * SCHEMA
 * ───────────────────────────────────────────────────────────────────────────
 * Expects a single flat body Portable Text array from Sanity (replaces the
 * legacy pages[]). Every top-level block carries a Sanity _key, which the
 * paginator uses to assign blocks to pages without positional index drift.
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
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vertical safety margin (px) subtracted from the available page height when
 * packing blocks into a landscape page. Absorbs sub-pixel rounding, the panel
 * bottom-margin, and line-box rounding so the last block on a page can never be
 * clipped by the page's overflow:hidden. ~28px is roughly one prose line —
 * invisible to the reader but enough to prevent the clipping seen on pages 6+.
 */
const PAGE_SAFETY_BUFFER_PX = 28

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

/**
 * normalizeBlocks
 *
 * Guarantees every block has a globally unique _key for a given body snapshot.
 * Sanity's pages[] -> flat body migration can leave duplicate or missing _key
 * values; because the key -> block Map (keyIndex) is keyed by _key, duplicates
 * would silently overwrite earlier blocks and drop their content from the
 * rendered pages. Re-keying as blk-{index}-{original} makes every key unique
 * and stable, preventing that content loss.
 *
 * @param blocks Raw Portable Text blocks from Sanity.
 * @returns A new array with each _key replaced by blk-{i}-{original}.
 */
export function normalizeBlocks(blocks: BodyBlock[]): BodyBlock[] {
  return blocks.map((block, index) => {
    const original = typeof block?._key === 'string' ? block._key : 'nokey'
    return { ...block, _key: `blk-${index}-${original}` }
  })
}

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
// Lightbox context
// Lets PanelImageRenderer open the lightbox without prop-drilling through the
// PortableText component map.
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxContextValue {
  openLightbox: (img: LightboxImage) => void
}

export const LightboxContext = createContext<LightboxContextValue>({
  openLightbox: () => {},
})

/** Hook for nested components to access the lightbox opener. */
export function useLightbox() {
  return useContext(LightboxContext)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox overlay
//
// Accessibility structure:
//   outer div  role="presentation"  — visual backdrop, click-to-dismiss.
//   inner div  role="dialog" aria-modal aria-label onKeyDown — the dialog panel.
//
// The <Image> is rendered at the asset's native width/height (passed in via the
// LightboxImage payload) with no CSS width cap other than the viewport bound in
// .lightbox-image, so the enlarged view shows the true full-resolution image.
// ─────────────────────────────────────────────────────────────────────────────

function Lightbox({ image, onClose }: { image: LightboxImage | null; onClose: () => void }) {
  // Window-level Escape listener catches keyboard events regardless of which
  // element currently has focus while the lightbox is open.
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
    <div className="lightbox-overlay" role="presentation" onClick={onClose}>
      <div
        className="lightbox-inner"
        role="dialog"
        aria-modal="true"
        aria-label={image.alt}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <button className="lightbox-close" onClick={onClose} aria-label="Close image">
          ✕
        </button>
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="lightbox-image"
          quality={100}
          unoptimized
          priority
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CoverPage
// Renders both the landscape (square) and portrait (9:16) cover images.
// CSS orientation rules show the appropriate one and hide the other.
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
          {/* Square / landscape cover — CSS hides this in portrait orientation */}
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
          {/* 9:16 portrait cover — CSS hides this in landscape orientation */}
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
// PanelImageBlock type — shape of an inline panelImage block from Sanity
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
// Must be a capitalized component so React hook rules are satisfied — useContext
// is called inside. ALWAYS uses block.alignment with no orientation override.
// The figure carries a data-key so the landscape paginator can map it to a page.
//
// Two URLs are derived from the asset:
//   thumbUrl — optimised WebP (q=90) for fast inline display.
//   fullUrl  — full-resolution original (fit=max, q=100) for the lightbox, at
//              the asset's native pixel dimensions (never downscaled).
// ─────────────────────────────────────────────────────────────────────────────

function PanelImageRenderer({ value: block }: { value: PanelImageBlock }) {
  const { openLightbox } = useContext(LightboxContext)

  const asset = block.image?.asset
  /** Inline thumbnail — optimised WebP. */
  const thumbUrl = asset?.url ? `${asset.url}?auto=format&fm=webp&q=90` : null
  /** Lightbox source — full native resolution, uncropped, max quality. */
  const fullUrl = asset?.url ? `${asset.url}?fit=max&q=100` : null

  if (!thumbUrl || !fullUrl) return null

  const dims = asset?.metadata?.dimensions
  // Native dimensions drive the lightbox <Image> so it renders at true size.
  const width = dims?.width ?? 1024
  const height = dims?.height ?? 1024
  const altText = block.alt ?? 'Panel illustration'

  // Always block.alignment — no landscapeMode override ever.
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
          src={thumbUrl}
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
// makeComponents — PortableText component map.
// Every top-level element carries a data-key so the paginator can assign it to
// a page without relying on positional indices (which drift if a block renders
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
 * buildSpreads
 *
 * Maps an ordered list of page key-groups onto book spreads:
 *   - The first page sits to the RIGHT of the cover.
 *   - Remaining pages are paired into subsequent left/right spreads.
 *   - An odd final page leaves a blank right-hand page.
 *
 * @param pages Ordered array of pages, each an ordered array of block _key values.
 * @returns Ordered array of spreads with running page numbers.
 */
function buildSpreads(pages: string[][]): Spread[] {
  const spreads: Spread[] = []
  let pageNo = 1

  const first = pages[0] ?? []
  spreads.push({ kind: 'cover', rightKeys: first, rightPageNo: pageNo++ })

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
// Tracks viewport orientation via matchMedia. Returns:
//   null  during SSR / before first client resolution (unknown)
//   true  landscape
//   false portrait
//
// State updates are deferred to requestAnimationFrame to satisfy the project's
// react-hooks/set-state-in-effect rule and avoid a synchronous render cascade.
// ─────────────────────────────────────────────────────────────────────────────

function useIsLandscape(): boolean | null {
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(orientation: landscape)')
    let raf = 0
    const apply = (matches: boolean) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setIsLandscape(matches))
    }
    apply(mq.matches)
    const onChange = (event: MediaQueryListEvent) => apply(event.matches)
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
// Measurement-driven pagination for the landscape book layout.
//
// 1. A hidden measurer renders the entire body at the exact width and padding
//    of a real right-hand page (same CSS classes + paginated panel caps),
//    with its height allowed to grow.
// 2. After web fonts settle and the browser paints, each top-level block's TRUE
//    bottom edge is measured with getBoundingClientRect() relative to the
//    prose-body top. Using the rect bottom (not offsetTop + offsetHeight)
//    correctly accounts for floated panels and their bottom margins, which is
//    what previously caused text and panels to be clipped on later pages.
// 3. Blocks are greedily packed so each page's content bottom never exceeds
//    (measured page content height − PAGE_SAFETY_BUFFER_PX). A block taller
//    than a full page becomes its own page (the CSS panel caps keep panels
//    within one page, so this only guards pathological cases).
//
// Waiting on document.fonts.ready before measuring prevents the classic
// "pagination stops partway" bug caused by measuring pre-webfont line heights.
// ─────────────────────────────────────────────────────────────────────────────

function useLandscapePagination(
  blocks: BodyBlock[],
  enabled: boolean
): { measurerRef: React.RefObject<HTMLDivElement | null>; pages: string[][] | null } {
  const measurerRef = useRef<HTMLDivElement | null>(null)
  const [pages, setPages] = useState<string[][] | null>(null)

  useEffect(() => {
    if (!enabled || blocks.length === 0) {
      // Portrait or empty body: no pagination. Clear any stale result (deferred
      // to rAF to satisfy the set-state-in-effect lint rule).
      const raf = requestAnimationFrame(() => {
        setPages((prev) => (prev === null ? prev : null))
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

      // Page box height MUST be one real, fixed page — the live paginated page is
      // a grid cell fixed at 100vh, so window.innerHeight is the correct value.
      //
      // We deliberately do NOT read the measurer page's own height here: the
      // measurer renders with height:auto + overflow:visible so it grows to fit
      // ALL blocks. Reading its getBoundingClientRect().height would return the
      // full multi-thousand-pixel content height, making `available` enormous and
      // cramming the entire story onto page 1 (which then clips). Padding is read
      // from the page's computed style (padding is height-independent).
      const cs = window.getComputedStyle(page)
      const padTop = parseFloat(cs.paddingTop) || 0
      const padBottom = parseFloat(cs.paddingBottom) || 0
      const available = window.innerHeight - padTop - padBottom - PAGE_SAFETY_BUFFER_PX

      const proseTop = proseBody.getBoundingClientRect().top
      const children = Array.from(proseBody.children) as HTMLElement[]

      // Measure each block's true top and bottom edges relative to the prose
      // body origin. getBoundingClientRect().bottom captures floated panels and
      // their margins, unlike offsetTop + offsetHeight.
      const measured = children
        .map((el) => {
          const rect = el.getBoundingClientRect()
          const key = el.getAttribute('data-key')
          return key ? { key, top: rect.top - proseTop, bottom: rect.bottom - proseTop } : null
        })
        .filter((m): m is { key: string; top: number; bottom: number } => Boolean(m))

      if (measured.length === 0 || available <= 0) {
        setPages([measured.map((m) => m.key)])
        return
      }

      // Greedy pack: a block joins the current page while the distance from the
      // page's first-block top to this block's bottom fits the available height.
      // A block that alone exceeds the available height is placed on its own
      // page so it is never merged into an overflowing page.
      const result: string[][] = []
      let current: string[] = []
      let startTop = measured[0].top

      for (const m of measured) {
        const wouldOverflow = current.length > 0 && m.bottom - startTop > available
        if (wouldOverflow) {
          result.push(current)
          current = [m.key]
          startTop = m.top
        } else {
          current.push(m.key)
        }
      }
      if (current.length > 0) result.push(current)

      setPages(result)
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    const runAfterFonts = () => {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        document.fonts.ready.then(schedule).catch(schedule)
      } else {
        schedule()
      }
    }

    const onResize = () => {
      setPages(null)
      runAfterFonts()
    }

    runAfterFonts()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [enabled, blocks])

  return { measurerRef, pages }
}

// ─────────────────────────────────────────────────────────────────────────────
// SingleSpread
// The non-paginated fallback used for portrait and for landscape before
// pagination has been computed. Cover on the left, all body on the right.
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
        {/* LEFT PAGE — cover image */}
        <CoverPage coverImage={coverImage} coverImagePortrait={coverImagePortrait} title={title} />

        {/* SPINE */}
        <div className="journal-spine" aria-hidden="true" />

        {/* RIGHT PAGE — all story body content */}
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

  // Normalize keys first so duplicate Sanity _key values can't drop content.
  const blocks = useMemo<BodyBlock[]>(() => normalizeBlocks(body ?? []), [body])
  const components = useMemo(() => makeComponents(), [])

  // key to block map — used to rebuild pages from measured key-groups.
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
  const { measurerRef, pages } = useLandscapePagination(blocks, paginate)

  const renderKeys = useCallback(
    (keys: string[]) => {
      const slice = keys
        .map((key) => keyIndex.get(key))
        .filter((block): block is BodyBlock => Boolean(block))
      if (slice.length === 0) return null
      return <PortableText value={slice} components={components} />
    },
    [keyIndex, components]
  )

  const spreads = useMemo(() => (pages ? buildSpreads(pages) : []), [pages])
  const showPaginated = paginate && pages !== null && spreads.length > 0

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
           * Hidden measurer — mounted only while landscape pagination is pending.
           * Renders the entire body at real right-page width/padding (plus the
           * paginated panel caps) so measured heights match the live layout.
           */}
          {paginate && pages === null && (
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
