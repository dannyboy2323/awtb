'use client'

/**
 * StoryReader
 *
 * Renders the full story reading experience.
 *
 * LAYOUT (CSS-controlled, no JavaScript orientation switching)
 * ───────────────────────────────────────────────────────────
 * Always renders a single journal spread: cover on the left, all body
 * content on the right. The CSS portrait media query stacks them vertically.
 *
 *   Landscape: grid — cover (left 50%) | body (right 50%, overflow:auto)
 *   Portrait:  flex column — cover (100dvh) then body below
 *
 * INLINE PANELS
 * ─────────────
 * Panel images always use their Sanity alignment field (left/right/center/full).
 * No orientation-based override of any kind. CSS float rules handle text-wrap
 * identically in portrait and landscape.
 *
 * PAGINATION
 * ──────────
 * Intentionally removed. Will be re-introduced in a separate focused pass
 * once this baseline rendering is confirmed stable.
 *
 * SCHEMA
 * ──────
 * Expects a single `body` Portable Text array from Sanity (replaces pages[]).
 */

import React, { useState, useCallback, createContext, useContext } from 'react'
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
// Lightbox context
// Lets PanelImageRenderer open the lightbox without prop-drilling through
// the PortableText component map.
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
// Must be a capitalized component so React hook rules are satisfied —
// useContext is called inside. ALWAYS uses block.alignment with no
// orientation override, matching how portrait has always worked correctly.
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

  // Always block.alignment — no landscapeMode override ever.
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
// makeComponents — PortableText component map, no orientation parameter
// ─────────────────────────────────────────────────────────────────────────────

function makeComponents(): PortableTextComponents {
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

  const blocks = body ?? []
  const components = makeComponents()

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      <div className="story-reader">
        <main className="story-content" role="main" aria-label={`${title} — story reader`}>
          <section className="journal-spread" aria-label="Spread 1">
            <div className="journal-book journal-book--cover">
              {/* LEFT PAGE — cover image */}
              <CoverPage
                coverImage={coverImage}
                coverImagePortrait={coverImagePortrait}
                title={title}
              />

              {/* SPINE */}
              <div className="journal-spine" aria-hidden="true" />

              {/*
               * RIGHT PAGE — all story body content.
               * Landscape: 100vh column, content scrolls via overflow:auto
               *            inherited from the base .journal-page rule.
               * Portrait:  full-width below the cover — .journal-book--cover
               *            gets height:auto in portrait via CSS media query,
               *            so this page expands naturally with content.
               */}
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
        </main>

        <Lightbox image={lightboxImage} onClose={closeLightbox} />
      </div>
    </LightboxContext.Provider>
  )
}
