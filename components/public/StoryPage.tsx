"use client";

/**
 * StoryPage
 *
 * Renders one "spread" of the open journal: left page with 6 graphic novel
 * panels, right page with the prose text for that story page.
 *
 * The journal visual is achieved via CSS — a realistic paper texture background
 * image (or CSS grain + color), a subtle center spine shadow, and page-curl
 * shadow on the outer edges.
 *
 * Each StoryPage is one scroll section. The reader scrolls through all pages
 * of a story sequentially, with page breaks visually separated by the journal
 * binding gap.
 *
 * @param panels     - Array of panels for this page (up to 6)
 * @param prose      - Sanity PortableText blocks for the right page
 * @param pageNum    - 1-based page number
 * @param pageTotal  - Total number of pages in the story
 * @param layout     - Panel layout mode ("grid" | "scattered")
 * @param storyTitle - Story title for aria-label context
 */

import React from "react";
import { PortableText } from "@portabletext/react";
import PanelGrid from "./PanelGrid";
import type { PanelLayout } from "./StoryNavBar";

interface Panel {
  _id: string;
  alt: string | null;
  caption: string | null;
  image: {
    asset: {
      _id: string;
      url: string;
      metadata: { dimensions: { width: number; height: number } };
    } | null;
    hotspot: { x: number; y: number } | null;
    crop: { top: number; bottom: number; left: number; right: number } | null;
  } | null;
}

interface StoryPageProps {
  panels: Panel[];
  prose: unknown;
  pageNum: number;
  pageTotal: number;
  layout: PanelLayout;
  storyTitle: string;
}

/**
 * Custom PortableText components styled for the journal right-page aesthetic.
 * Mignola-inspired: strong contrast, editorial feel, no rounded corners.
 */
const portableTextComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="prose-paragraph">{children}</p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="prose-h2">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="prose-h3">{children}</h3>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="prose-blockquote">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="prose-strong">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="prose-em">{children}</em>
    ),
  },
};

/**
 * One full journal spread — left page (panels) + right page (prose).
 * Visually separated from adjacent spreads by a gap that evokes page turning.
 */
export default function StoryPage({
  panels,
  prose,
  pageNum,
  pageTotal,
  layout,
  storyTitle,
}: StoryPageProps) {
  return (
    <section
      className="journal-spread"
      aria-label={`${storyTitle} — Page ${pageNum} of ${pageTotal}`}
      id={`story-page-${pageNum}`}
    >
      {/* Journal outer shadow and texture */}
      <div className="journal-book">
        {/* Left page — graphic novel panels */}
        <div className="journal-page journal-page--left" aria-label="Illustrations">
          {/* Decorative page number */}
          <span className="page-number page-number--left" aria-hidden="true">
            {(pageNum - 1) * 2 + 1}
          </span>

          <PanelGrid panels={panels} layout={layout} pageNum={pageNum} />
        </div>

        {/* Spine */}
        <div className="journal-spine" aria-hidden="true" />

        {/* Right page — prose */}
        <div className="journal-page journal-page--right" aria-label="Story text">
          {/* Decorative page number */}
          <span className="page-number page-number--right" aria-hidden="true">
            {(pageNum - 1) * 2 + 2}
          </span>

          {/* Chapter / page marker */}
          <div className="prose-page-marker" aria-hidden="true">
            <span className="prose-page-marker-line" />
            <span className="prose-page-marker-text">
              {pageNum === 1 ? "Chapter I" : `Page ${pageNum}`}
            </span>
            <span className="prose-page-marker-line" />
          </div>

          {/* Story text */}
          <div className="prose-body">
            {prose ? (
              // @ts-expect-error — PortableText accepts unknown block array
              <PortableText value={prose} components={portableTextComponents} />
            ) : (
              <p className="prose-placeholder">[ No text for this page ]</p>
            )}
          </div>

          {/* Page footer */}
          {pageNum === pageTotal && (
            <div className="prose-end-mark" aria-label="End of story">
              ✦
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
