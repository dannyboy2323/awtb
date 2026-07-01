'use client'

/**
 * StoryReader
 *
 * Client-side wrapper for the full story reading experience.
 *
 * Layout (landscape):
 *   Spread 0: Cover image (left page) | Page 1 prose+panels (right page)
 *   Spread 1: Page 2 (left page)      | Page 3 (right page)
 *
 * Layout (portrait — via CSS media query):
 *   Single column: Cover → Page 1 → Page 2 → ...
 *
 * Cover images:
 *   - Landscape: uses coverImage (square 1:1)
 *   - Portrait:  uses coverImagePortrait (9:16), falls back to coverImage
 *   The switch is done via CSS — both images are rendered, portrait one
 *   is hidden in landscape via .cover-image--portrait { display: none }
 *   and vice versa. This avoids JS orientation detection issues with SSR.
 *
 * Lightbox:
 *   Clicking any inline panel image opens it full-screen.
 */

import React, { useState, createContext, useContext, useCallback } from 'react'
import Image from 'next/image'
import StoryPageContent from './StoryPage'

// ----------------------------------------------------------------
// Lightbox context
// ----------------------------------------------------------------

export interface LightboxImage {
  url: string
  alt: string
  width: number
  height: number
}

interface LightboxContextValue {
  openLightbox: (img: LightboxImage) => void
}

export const LightboxContext = createContext<LightboxContextValue>({
  openLightbox: () => {},
})

export function useLightbox() {
  return useContext(LightboxContext)
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface CoverImageAsset {
  asset: { url: string; _id: string } | null
  alt?: string | null
}

interface StoryPageData {
  _id: string
  _key: string
  prose: unknown
}

interface StoryReaderProps {
  title: string
  coverImage: CoverImageAsset | null
  coverImagePortrait: CoverImageAsset | null
  pages: StoryPageData[]
}

// ----------------------------------------------------------------
// Lightbox
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Cover page
// Two images rendered — CSS controls which is visible based on orientation.
// ----------------------------------------------------------------

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

  // Fall back to landscape image if no portrait provided
  const portraitUrl = coverImagePortrait?.asset?.url
    ? `${coverImagePortrait.asset.url}?auto=format&fm=webp&q=90`
    : landscapeUrl

  const altText = coverImage?.alt ?? `${title} cover`

  return (
    <div className="journal-page journal-page--cover" aria-label="Cover">
      {landscapeUrl ? (
        <div className="cover-image-wrap">
          {/* Landscape / square cover — shown in landscape orientation */}
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
          {/* Portrait cover — shown in portrait / mobile orientation */}
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

// ----------------------------------------------------------------
// Spread builder
// ----------------------------------------------------------------

type SpreadItem = 'cover' | StoryPageData

function buildSpreads(pages: StoryPageData[]): Array<[SpreadItem, StoryPageData | null]> {
  const spreads: Array<[SpreadItem, StoryPageData | null]> = []
  spreads.push(['cover', pages[0] ?? null])
  for (let i = 1; i < pages.length; i += 2) {
    spreads.push([pages[i], pages[i + 1] ?? null])
  }
  return spreads
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

export default function StoryReader({
  title,
  coverImage,
  coverImagePortrait,
  pages,
}: StoryReaderProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const openLightbox = useCallback((img: LightboxImage) => setLightboxImage(img), [])
  const closeLightbox = useCallback(() => setLightboxImage(null), [])
  const spreads = buildSpreads(pages)

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      <div className="story-reader">
        <main className="story-content" role="main" aria-label={`${title} — story reader`}>
          {spreads.map((spread, spreadIdx) => {
            const [left, right] = spread
            const isFirstSpread = spreadIdx === 0

            return (
              <section
                key={spreadIdx}
                className="journal-spread"
                aria-label={`Spread ${spreadIdx + 1}`}
              >
                <div className={`journal-book${isFirstSpread ? 'journal-book--cover' : ''}`}>
                  {/* LEFT PAGE */}
                  {left === 'cover' ? (
                    <CoverPage
                      coverImage={coverImage}
                      coverImagePortrait={coverImagePortrait}
                      title={title}
                    />
                  ) : (
                    <div className="journal-page journal-page--left">
                      <span className="page-number page-number--left" aria-hidden="true">
                        {spreadIdx * 2}
                      </span>
                      <StoryPageContent prose={(left as StoryPageData).prose} />
                    </div>
                  )}

                  {/* SPINE */}
                  <div className="journal-spine" aria-hidden="true" />

                  {/* RIGHT PAGE */}
                  <div className="journal-page journal-page--right">
                    {right ? (
                      <>
                        <span className="page-number page-number--right" aria-hidden="true">
                          {isFirstSpread ? 1 : spreadIdx * 2 + 1}
                        </span>
                        <StoryPageContent prose={right.prose} />
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
        <Lightbox image={lightboxImage} onClose={closeLightbox} />
      </div>
    </LightboxContext.Provider>
  )
}
