"use client";

/**
 * StoryReader
 *
 * Client-side wrapper for the full story reading experience.
 *
 * Layout (landscape):
 *   Spread 0: Cover image (left page) | Page 1 prose+panels (right page)
 *   Spread 1: Page 2 (left page)      | Page 3 (right page)
 *   Spread 2: Page 4 (left page)      | Page 5 (right page)
 *
 * Layout (portrait — via CSS media query):
 *   Single column: Cover → Page 1 → Page 2 → Page 3 → ...
 *   Background switches to 9:16 portrait journal image.
 *
 * Lightbox:
 *   Clicking any inline panel image opens it full-screen.
 *   State managed here, shared via LightboxContext.
 */

import React, { useState, createContext, useContext, useCallback } from "react";
import Image from "next/image";
import StoryPageContent from "./StoryPage";

// ----------------------------------------------------------------
// Lightbox context
// ----------------------------------------------------------------

export interface LightboxImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

interface LightboxContextValue {
  openLightbox: (img: LightboxImage) => void;
}

export const LightboxContext = createContext<LightboxContextValue>({
  openLightbox: () => {},
});

export function useLightbox() {
  return useContext(LightboxContext);
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface CoverImage {
  asset: { url: string; _id: string } | null;
  alt?: string | null;
}

interface StoryPageData {
  _id: string;
  _key: string;
  prose: unknown;
}

interface StoryReaderProps {
  title: string;
  coverImage: CoverImage | null;
  pages: StoryPageData[];
}

// ----------------------------------------------------------------
// Lightbox
// ----------------------------------------------------------------

function Lightbox({ image, onClose }: { image: LightboxImage | null; onClose: () => void }) {
  if (!image) return null;
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
  );
}

// ----------------------------------------------------------------
// Cover page
// ----------------------------------------------------------------

function CoverPage({ coverImage, title }: { coverImage: CoverImage | null; title: string }) {
  const imageUrl = coverImage?.asset?.url
    ? `${coverImage.asset.url}?auto=format&fm=webp&q=90`
    : null;

  return (
    <div className="journal-page journal-page--cover" aria-label="Cover">
      {imageUrl ? (
        <div className="cover-image-wrap">
          <Image
            src={imageUrl}
            alt={coverImage?.alt ?? `${title} cover`}
            fill
            className="cover-image"
            sizes="50vw"
            priority
          />
        </div>
      ) : (
        <div className="cover-placeholder">
          <span className="cover-title">{title}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Spread builder
// ----------------------------------------------------------------

type SpreadItem = "cover" | StoryPageData;

function buildSpreads(pages: StoryPageData[]): Array<[SpreadItem, StoryPageData | null]> {
  const spreads: Array<[SpreadItem, StoryPageData | null]> = [];
  // First spread: cover left, page 0 right
  spreads.push(["cover", pages[0] ?? null]);
  // Remaining pages in pairs
  for (let i = 1; i < pages.length; i += 2) {
    spreads.push([pages[i], pages[i + 1] ?? null]);
  }
  return spreads;
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

export default function StoryReader({ title, coverImage, pages }: StoryReaderProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);
  const openLightbox = useCallback((img: LightboxImage) => setLightboxImage(img), []);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);
  const spreads = buildSpreads(pages);

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      <div className="story-reader">
        <main className="story-content" role="main" aria-label={`${title} — story reader`}>
          {spreads.map((spread, spreadIdx) => {
            const [left, right] = spread;
            const isFirstSpread = spreadIdx === 0;

            return (
              <section
                key={spreadIdx}
                className="journal-spread"
                aria-label={`Spread ${spreadIdx + 1}`}
              >
                <div className="journal-book">
                  {/* LEFT PAGE */}
                  {left === "cover" ? (
                    <CoverPage coverImage={coverImage} title={title} />
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
            );
          })}
        </main>
        <Lightbox image={lightboxImage} onClose={closeLightbox} />
      </div>
    </LightboxContext.Provider>
  );
}
