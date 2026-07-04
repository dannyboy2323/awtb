/**
 * Story reader component unit tests.
 *
 * Tests cover:
 *   - StoryReader: renders cover + all pages in spreads, lightbox opens/closes
 *   - StoryPageContent: renders prose text and inline panel images
 *
 * Run with: npm test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StoryReader, { LightboxContext } from "@/components/public/StoryReader";
import StoryPageContent from "@/components/public/StoryPage";

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------

const COVER_IMAGE = {
  asset: {
    _id: "asset-cover",
    url: "https://cdn.sanity.io/images/test/production/cover.webp",
  },
  alt: "Story cover art",
};

const makePanelImageBlock = (id: string, alignment: "left" | "right") => ({
  _type: "panelImage",
  _key: `panel-${id}`,
  alignment,
  alt: `Panel illustration ${id}`,
  caption: null,
  image: {
    asset: {
      _id: `asset-${id}`,
      url: `https://cdn.sanity.io/images/test/production/${id}.webp`,
      metadata: { dimensions: { width: 800, height: 800 } },
    },
  },
});

const makeProseBlock = (text: string, key: string) => ({
  _type: "block",
  _key: key,
  style: "normal",
  children: [{ _type: "span", _key: `span-${key}`, text, marks: [] }],
  markDefs: [],
});

const SAMPLE_PROSE = [
  makePanelImageBlock("panel-1", "left"),
  makeProseBlock("The city never sleeps.", "block-1"),
  makePanelImageBlock("panel-2", "right"),
  makeProseBlock("He ran, but there was nowhere to hide.", "block-2"),
];

const SAMPLE_PAGES = [
  { _id: "page-1", _key: "key-1", prose: SAMPLE_PROSE },
  { _id: "page-2", _key: "key-2", prose: [makeProseBlock("The end.", "block-3")] },
  { _id: "page-3", _key: "key-3", prose: [makeProseBlock("Epilogue.", "block-4")] },
];

// ----------------------------------------------------------------
// StoryReader tests
// ----------------------------------------------------------------

describe("StoryReader", () => {
  it("renders without crashing", () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        pages={SAMPLE_PAGES}
      />
    );
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("renders the cover image alt text", () => {
    render(
      <StoryReader
        title="Adventures With The Bull"
        coverImage={COVER_IMAGE}
        pages={SAMPLE_PAGES}
      />
    );
    expect(screen.getByAltText("Story cover art")).toBeTruthy();
  });

  it("renders cover placeholder when no coverImage provided", () => {
    render(
      <StoryReader
        title="No Cover Story"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    expect(screen.getByText("No Cover Story")).toBeTruthy();
  });

  it("renders correct number of spreads", () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    // 3 pages → spread 0: cover + page1, spread 1: page2 + page3
    const spreads = document.querySelectorAll(".journal-spread");
    expect(spreads.length).toBe(2);
  });

  it("renders prose text from pages", () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    expect(screen.getByText("The city never sleeps.")).toBeTruthy();
    expect(screen.getByText("The end.")).toBeTruthy();
  });

  it("renders inline panel images", () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    expect(screen.getByAltText("Panel illustration panel-1")).toBeTruthy();
    expect(screen.getByAltText("Panel illustration panel-2")).toBeTruthy();
  });

  it("opens lightbox when panel image is clicked", () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    const panelBtn = screen.getByLabelText("View full size: Panel illustration panel-1");
    fireEvent.click(panelBtn);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("closes lightbox when overlay is clicked", () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    fireEvent.click(screen.getByLabelText("View full size: Panel illustration panel-1"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes lightbox when close button is clicked", () => {
    render(
      <StoryReader
        title="Test"
        coverImage={null}
        pages={SAMPLE_PAGES}
      />
    );
    fireEvent.click(screen.getByLabelText("View full size: Panel illustration panel-1"));
    fireEvent.click(screen.getByLabelText("Close image"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

// ----------------------------------------------------------------
// StoryPageContent tests
// ----------------------------------------------------------------

describe("StoryPageContent", () => {
  const mockOpenLightbox = vi.fn();

  function renderWithLightbox(ui: React.ReactElement) {
    return render(
      <LightboxContext.Provider value={{ openLightbox: mockOpenLightbox }}>
        {ui}
      </LightboxContext.Provider>
    );
  }

  it("renders prose text", () => {
    renderWithLightbox(
      <StoryPageContent prose={[makeProseBlock("Hello world.", "b1")]} />
    );
    expect(screen.getByText("Hello world.")).toBeTruthy();
  });

  it("renders placeholder when prose is null", () => {
    renderWithLightbox(<StoryPageContent prose={null} />);
    expect(screen.getByText("[ No content for this page ]")).toBeTruthy();
  });

  it("renders inline panel image", () => {
    renderWithLightbox(
      <StoryPageContent prose={[makePanelImageBlock("test-panel", "left")]} />
    );
    expect(screen.getByAltText("Panel illustration test-panel")).toBeTruthy();
  });

  it("applies correct alignment class to inline panel", () => {
    renderWithLightbox(
      <StoryPageContent prose={[makePanelImageBlock("left-panel", "left")]} />
    );
    expect(document.querySelector(".inline-panel--left")).toBeTruthy();
  });

  it("calls openLightbox when panel is clicked", () => {
    renderWithLightbox(
      <StoryPageContent prose={[makePanelImageBlock("click-panel", "right")]} />
    );
    fireEvent.click(
      screen.getByLabelText("View full size: Panel illustration click-panel")
    );
    expect(mockOpenLightbox).toHaveBeenCalledTimes(1);
    expect(mockOpenLightbox).toHaveBeenCalledWith(
      expect.objectContaining({ alt: "Panel illustration click-panel" })
    );
  });
});
