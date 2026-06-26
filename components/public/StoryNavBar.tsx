"use client";

/**
 * StoryNavBar
 *
 * Top horizontal navigation bar for the story reader.
 * Houses the story title and view-toggle icon slots (print, ePub, PDF, etc.).
 * Toggles are placeholder stubs — the actual export functionality is a
 * separate follow-on task. The panel layout toggle (grid vs scattered) is
 * live and switches the visual presentation of the left-page panels.
 *
 * @param title - Story title displayed in the center of the bar
 * @param panelLayout - Current panel layout mode ("grid" | "scattered")
 * @param onPanelLayoutToggle - Callback to flip between grid and scattered
 */

import React from "react";
import { cn } from "@/lib/utils";

/** Icon: printer-friendly view */
function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

/** Icon: ePub / ebook view */
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

/** Icon: PDF download */
function FileDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <polyline points="9 15 12 18 15 15" />
    </svg>
  );
}

/** Icon: grid layout for panels */
function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

/** Icon: scattered/photo layout for panels */
function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export type PanelLayout = "grid" | "scattered";

interface StoryNavBarProps {
  title: string;
  panelLayout: PanelLayout;
  onPanelLayoutToggle: () => void;
}

/**
 * Top navigation bar for the story reader.
 * Left side: view toggle icons (print, ePub, PDF — stubs for now).
 * Center: story title.
 * Right side: panel layout toggle (grid ↔ scattered).
 */
export default function StoryNavBar({
  title,
  panelLayout,
  onPanelLayoutToggle,
}: StoryNavBarProps) {
  const iconClass = "w-5 h-5";
  const btnBase =
    "flex items-center justify-center w-9 h-9 rounded transition-colors";
  const btnIdle = "text-stone-400 hover:text-stone-100 hover:bg-stone-700/60";
  const btnActive = "text-amber-400 bg-stone-700/60";

  return (
    <nav
      className="story-nav-bar"
      role="navigation"
      aria-label="Story reader controls"
    >
      {/* Left: export / view toggles — stubs, not yet implemented */}
      <div className="story-nav-left">
        <button
          className={cn(btnBase, btnIdle, "story-nav-btn")}
          title="Printer-friendly view (coming soon)"
          aria-label="Printer-friendly view"
          disabled
        >
          <PrinterIcon className={iconClass} />
        </button>
        <button
          className={cn(btnBase, btnIdle, "story-nav-btn")}
          title="ePub / eBook (coming soon)"
          aria-label="Download as ePub"
          disabled
        >
          <BookOpenIcon className={iconClass} />
        </button>
        <button
          className={cn(btnBase, btnIdle, "story-nav-btn")}
          title="Download PDF (coming soon)"
          aria-label="Download as PDF"
          disabled
        >
          <FileDownIcon className={iconClass} />
        </button>
      </div>

      {/* Center: story title */}
      <h1 className="story-nav-title">{title}</h1>

      {/* Right: panel layout toggle — live */}
      <div className="story-nav-right">
        <button
          className={cn(
            btnBase,
            panelLayout === "grid" ? btnActive : btnIdle,
            "story-nav-btn"
          )}
          title="Grid layout"
          aria-label="Switch to grid panel layout"
          aria-pressed={panelLayout === "grid"}
          onClick={() => panelLayout !== "grid" && onPanelLayoutToggle()}
        >
          <GridIcon className={iconClass} />
        </button>
        <button
          className={cn(
            btnBase,
            panelLayout === "scattered" ? btnActive : btnIdle,
            "story-nav-btn"
          )}
          title="Scattered photo layout"
          aria-label="Switch to scattered panel layout"
          aria-pressed={panelLayout === "scattered"}
          onClick={() => panelLayout !== "scattered" && onPanelLayoutToggle()}
        >
          <LayersIcon className={iconClass} />
        </button>
      </div>
    </nav>
  );
}
