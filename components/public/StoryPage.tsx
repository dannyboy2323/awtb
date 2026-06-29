'use client'

/**
 * StoryPageContent
 *
 * Renders the Portable Text content for a single story page.
 * Supports standard text blocks AND inline panelImage blocks,
 * which can be floated left/right/center/full within the prose flow.
 *
 * Clicking a panel image opens it in the lightbox (via LightboxContext).
 *
 * @param prose - Sanity Portable Text array (blocks + panelImage objects)
 */

import React from 'react'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { useLightbox } from './StoryReader'

interface StoryPageContentProps {
  prose: unknown
}

function buildImageUrl(assetUrl: string, width: number): string {
  return `${assetUrl}?w=${width}&auto=format&fm=webp&q=90`
}

interface PanelImageValue {
  _key: string
  image: {
    asset: {
      url: string
      _id: string
      metadata?: { dimensions?: { width: number; height: number } }
    } | null
  } | null
  alt: string | null
  caption: string | null
  alignment: 'left' | 'right' | 'center' | 'full' | null
}

function InlinePanelImage({ value }: { value: PanelImageValue }) {
  const { openLightbox } = useLightbox()

  const assetUrl = value?.image?.asset?.url
  if (!assetUrl) return null

  const alt = value.alt ?? 'Story illustration'
  const alignment = value.alignment ?? 'left'
  const dims = value.image?.asset?.metadata?.dimensions
  const naturalWidth = dims?.width ?? 800
  const naturalHeight = dims?.height ?? 800

  // Increased by 150%: 280 → 420, 600 → 900
  const displaySize = alignment === 'full' ? 900 : 420
  const thumbUrl = buildImageUrl(assetUrl, displaySize)
  const fullUrl = buildImageUrl(assetUrl, naturalWidth)

  function handleClick() {
    openLightbox({ url: fullUrl, alt, width: naturalWidth, height: naturalHeight })
  }

  return (
    <figure className={`inline-panel inline-panel--${alignment}`} aria-label={alt}>
      <button
        className="inline-panel-btn"
        onClick={handleClick}
        aria-label={`View full size: ${alt}`}
        title="Click to enlarge"
      >
        <Image
          src={thumbUrl}
          alt={alt}
          width={displaySize}
          height={displaySize}
          className="inline-panel-image"
          sizes={
            alignment === 'full'
              ? '(max-width: 700px) 100vw, 900px'
              : '(max-width: 700px) 100vw, 420px'
          }
        />
        <span className="inline-panel-zoom-hint" aria-hidden="true">
          ⊕
        </span>
      </button>
      {value.caption && <figcaption className="inline-panel-caption">{value.caption}</figcaption>}
    </figure>
  )
}

const portableTextComponents = {
  types: {
    panelImage: InlinePanelImage,
  },
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="prose-paragraph">{children}</p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="prose-h2">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="prose-h3">{children}</h3>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="prose-blockquote">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="prose-strong">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => <em className="prose-em">{children}</em>,
    underline: ({ children }: { children?: React.ReactNode }) => <u>{children}</u>,
  },
}

export default function StoryPageContent({ prose }: StoryPageContentProps) {
  if (!prose) {
    return <p className="prose-placeholder">[ No content for this page ]</p>
  }

  return (
    <div className="prose-body">
      {/* @ts-expect-error — PortableText accepts unknown block array */}
      <PortableText value={prose} components={portableTextComponents} />
    </div>
  )
}
