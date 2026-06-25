"use client";

/**
 * StoryReader
 *
 * Client-side wrapper for the full story reading experience.
 * Owns the panel layout toggle state (grid | scattered) and renders:
 *   - StoryNavBar at the top
 *   - A sequence of StoryPage spreads, one per story page
 *
 * Data is fetched server-side and passed in as props — this component
 * is pure presentation + state management.
 *
 * @param title  - Story title
 * @param pages  - Ordered array of story pages from Sanity
 */

import React, { useState } from "react";
import StoryNavBar, { type PanelLayout } from "./StoryNavBar";
import StoryPage from "./StoryPage";

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

interface StoryPageData {
  _id: string;
  _key: string;
  panels: Panel[] | null;
  prose: unknown;
}

interface StoryReaderProps {
  title: string;
  pages: StoryPageData[];
}

/**
 * Full story reader — nav bar + paginated journal spreads.
 * Manages the panel layout toggle state (grid vs scattered).
 */
export default function StoryReader({ title, pages }: StoryReaderProps) {
  const [panelLayout, setPanelLayout] = useState<PanelLayout>("grid");

  function toggleLayout() {
    setPanelLayout((prev) => (prev === "grid" ? "scattered" : "grid"));
  }

  return (
    <div className="story-reader">
      {/* Fixed top navigation bar */}
      <StoryNavBar
        title={title}
        panelLayout={panelLayout}
        onPanelLayoutToggle={toggleLayout}
      />

      {/* Scrollable story content */}
      <main className="story-content" role="main" aria-label={`${title} — story reader`}>
        {pages.map((page, idx) => (
          <StoryPage
            key={page._id}
            panels={page.panels ?? []}
            prose={page.prose}
            pageNum={idx + 1}
            pageTotal={pages.length}
            layout={panelLayout}
            storyTitle={title}
          />
        ))}
      </main>
    </div>
  );
}
