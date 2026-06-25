/**
 * Story reader component unit tests.
 *
 * Tests cover:
 *   - StoryNavBar: renders title, toggles layout mode, disables stub buttons
 *   - PanelGrid: renders correct number of panels, handles empty slots
 *   - StoryReader: renders all pages, switches layout on toggle
 *
 * These are unit tests using Vitest + Testing Library.
 * Run with: npm test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StoryNavBar from "@/components/public/StoryNavBar";
import PanelGrid from "@/components/public/PanelGrid";
import StoryReader from "@/components/public/StoryReader";

// ----------------------------------------------------------------
// Shared fixtures
// ----------------------------------------------------------------

const makePanel = (id: string, alt: string) => ({
  _id: id,
  alt,
  caption: null,
  image: {
    asset: {
      _id: `asset-${id}`,
      url: `https://cdn.sanity.io/images/test/production/${id}.webp`,
      metadata: { dimensions: { width: 800, height: 800 } },
    },
    hotspot: null,
    crop: null,
  },
});

const SAMPLE_PANELS = [
  makePanel("panel-1", "A bull charging through city streets"),
  makePanel("panel-2", "Close-up of worn boots on cobblestones"),
  makePanel("panel-3", "Rain-soaked rooftop silhouette"),
  makePanel("panel-4", "A prosecutor in a pinstripe suit"),
  makePanel("panel-5", "Shadowy alley with a single lamp"),
  makePanel("panel-6", "The bull looking over its shoulder"),
];

const SAMPLE_PAGES = [
  {
    _id: "page-1",
    _key: "key-1",
    panels: SAMPLE_PANELS,
    prose: [
      {
        _type: "block",
        _key: "block-1",
        style: "normal",
        children: [{ _type: "span", text: "The city never sleeps." }],
        markDefs: [],
      },
    ],
  },
  {
    _id: "page-2",
    _key: "key-2",
    panels: SAMPLE_PANELS.slice(0, 3),
    prose: [
      {
        _type: "block",
        _key: "block-2",
        style: "normal",
        children: [{ _type: "span", text: "He ran, but there was nowhere to hide." }],
        markDefs: [],
      },
    ],
  },
];

// ----------------------------------------------------------------
// StoryNavBar tests
// ----------------------------------------------------------------

describe("StoryNavBar", () => {
  it("renders the story title", () => {
    render(
      <StoryNavBar
        title="Adventures With The Bull"
        panelLayout="grid"
        onPanelLayoutToggle={vi.fn()}
      />
    );
    expect(screen.getByText("Adventures With The Bull")).toBeTruthy();
  });

  it("marks grid button as active when layout is grid", () => {
    render(
      <StoryNavBar
        title="Test"
        panelLayout="grid"
        onPanelLayoutToggle={vi.fn()}
      />
    );
    const gridBtn = screen.getByLabelText("Switch to grid panel layout");
    expect(gridBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("marks scattered button as active when layout is scattered", () => {
    render(
      <StoryNavBar
        title="Test"
        panelLayout="scattered"
        onPanelLayoutToggle={vi.fn()}
      />
    );
    const scatteredBtn = screen.getByLabelText("Switch to scattered panel layout");
    expect(scatteredBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onPanelLayoutToggle when switching layout", () => {
    const toggle = vi.fn();
    render(
      <StoryNavBar
        title="Test"
        panelLayout="grid"
        onPanelLayoutToggle={toggle}
      />
    );
    fireEvent.click(screen.getByLabelText("Switch to scattered panel layout"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("stub buttons (print, epub, pdf) are disabled", () => {
    render(
      <StoryNavBar
        title="Test"
        panelLayout="grid"
        onPanelLayoutToggle={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Printer-friendly view")).toBeDisabled();
    expect(screen.getByLabelText("Download as ePub")).toBeDisabled();
    expect(screen.getByLabelText("Download as PDF")).toBeDisabled();
  });
});

// ----------------------------------------------------------------
// PanelGrid tests
// ----------------------------------------------------------------

describe("PanelGrid", () => {
  it("renders 6 panels when all are provided", () => {
    render(
      <PanelGrid panels={SAMPLE_PANELS} layout="grid" pageNum={1} />
    );
    // 6 images should be present
    const images = document.querySelectorAll(".panel-image");
    expect(images.length).toBe(6);
  });

  it("renders empty slots when fewer than 6 panels are provided", () => {
    render(
      <PanelGrid panels={SAMPLE_PANELS.slice(0, 3)} layout="grid" pageNum={1} />
    );
    const emptySlots = document.querySelectorAll(".panel-slot--empty");
    expect(emptySlots.length).toBe(3);
  });

  it("applies scattered class when layout is scattered", () => {
    render(
      <PanelGrid panels={SAMPLE_PANELS} layout="scattered" pageNum={1} />
    );
    const grid = document.querySelector(".panel-grid--scattered");
    expect(grid).toBeTruthy();
  });

  it("does not apply scattered class when layout is grid", () => {
    render(
      <PanelGrid panels={SAMPLE_PANELS} layout="grid" pageNum={1} />
    );
    const grid = document.querySelector(".panel-grid--scattered");
    expect(grid).toBeNull();
  });

  it("renders alt text on images", () => {
    render(
      <PanelGrid panels={SAMPLE_PANELS} layout="grid" pageNum={1} />
    );
    expect(
      screen.getByAltText("A bull charging through city streets")
    ).toBeTruthy();
  });
});

// ----------------------------------------------------------------
// StoryReader integration tests
// ----------------------------------------------------------------

describe("StoryReader", () => {
  it("renders the correct number of story pages", () => {
    render(
      <StoryReader title="Adventures With The Bull" pages={SAMPLE_PAGES} />
    );
    // Each page creates a section with aria-label matching page number
    expect(screen.getByLabelText("Adventures With The Bull — Page 1 of 2")).toBeTruthy();
    expect(screen.getByLabelText("Adventures With The Bull — Page 2 of 2")).toBeTruthy();
  });

  it("starts in grid layout mode", () => {
    render(
      <StoryReader title="Test Story" pages={SAMPLE_PAGES} />
    );
    const gridBtn = screen.getByLabelText("Switch to grid panel layout");
    expect(gridBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("switches to scattered layout when toggle is clicked", () => {
    render(
      <StoryReader title="Test Story" pages={SAMPLE_PAGES} />
    );
    fireEvent.click(screen.getByLabelText("Switch to scattered panel layout"));
    expect(
      screen.getByLabelText("Switch to scattered panel layout").getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("renders story title in the nav bar", () => {
    render(
      <StoryReader title="The Bronze Bull" pages={SAMPLE_PAGES} />
    );
    expect(screen.getByText("The Bronze Bull")).toBeTruthy();
  });

  it("renders prose text from the first page", () => {
    render(
      <StoryReader title="Test" pages={SAMPLE_PAGES} />
    );
    expect(screen.getByText("The city never sleeps.")).toBeTruthy();
  });
});
