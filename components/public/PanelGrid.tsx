"use client";

/**
 * PanelGrid
 *
 * Renders the 6 graphic novel panels on the left page of the journal spread.
 *
 * Supports two visual modes controlled by the `layout` prop:
 *
 * "grid"      — Clean 2-column × 3-row grid. Panels are flush, square,
 *               with a thin ink-border. Feels like a comic book page.
 *
 * "scattered" — Panels are loosely arranged with slight individual rotations
 *               and drop shadows, evoking physical photographs spread on a
 *               desk or tucked inside a journal. The rotation angles are
 *               deterministic (seeded by panel index) so they don't shift
 *               on re-render.
 *
 * Images should be served as WebP from Sanity's image pipeline.
 * Always 1:1 (square) aspect ratio.
 *
 * @param panels  - Array of up to 6 panel objects from Sanity
 * @param layout  - "grid" | "scattered"
 * @param pageNum - 1-based page number (used for aria labels)
 */

import Image from "next/image";
import { cn } from "@/lib/utils";
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

interface PanelGridProps {
  panels: Panel[];
  layout: PanelLayout;
  pageNum: number;
}

/** Deterministic rotation angles for the scattered layout. */
const SCATTER_ROTATIONS = [-2.8, 1.5, -1.2, 2.4, -0.8, 1.9];
const SCATTER_TRANSLATIONS = [
  { x: -3, y: 2 },
  { x: 4, y: -3 },
  { x: -2, y: -2 },
  { x: 3, y: 4 },
  { x: -4, y: 1 },
  { x: 2, y: -4 },
];

/**
 * Builds a Sanity image URL with WebP format and size constraints.
 * Falls back to the raw asset URL if no transformations are needed.
 */
function buildPanelUrl(assetUrl: string, size = 480): string {
  // Sanity CDN URL transform: append query params for WebP + resize
  return `${assetUrl}?w=${size}&h=${size}&fit=crop&auto=format&fm=webp&q=90`;
}

/**
 * Left-page panel grid for one story page.
 * Renders exactly the panels provided (1–6). Empty slots are left blank.
 */
export default function PanelGrid({ panels, layout, pageNum }: PanelGridProps) {
  const slots = Array.from({ length: 6 }, (_, i) => panels[i] ?? null);

  return (
    <div
      className={cn("panel-grid", layout === "scattered" && "panel-grid--scattered")}
      aria-label={`Page ${pageNum} illustrations`}
    >
      {slots.map((panel, idx) => {
        if (!panel || !panel.image?.asset?.url) {
          // Empty slot — preserve grid position
          return (
            <div
              key={`empty-${idx}`}
              className="panel-slot panel-slot--empty"
              aria-hidden="true"
            />
          );
        }

        const imageUrl = buildPanelUrl(panel.image.asset.url);
        const altText = panel.alt ?? `Story panel ${idx + 1}, page ${pageNum}`;

        const scatterStyle =
          layout === "scattered"
            ? {
                transform: `rotate(${SCATTER_ROTATIONS[idx]}deg) translate(${SCATTER_TRANSLATIONS[idx].x}px, ${SCATTER_TRANSLATIONS[idx].y}px)`,
                zIndex: idx + 1,
              }
            : undefined;

        return (
          <figure
            key={panel._id}
            className="panel-slot"
            style={scatterStyle}
          >
            <div className="panel-image-wrap">
              <Image
                src={imageUrl}
                alt={altText}
                width={480}
                height={480}
                className="panel-image"
                sizes="(max-width: 1200px) 20vw, 15vw"
                priority={idx < 3 && pageNum === 1}
              />
            </div>
            {panel.caption && (
              <figcaption className="panel-caption">{panel.caption}</figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
