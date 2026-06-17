import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DeskHero from "@/components/public/DeskHero";

/**
 * DeskHero component tests.
 * Tests rendering and link behaviour with sample props.
 */
describe("DeskHero", () => {
  const defaultProps = {
    postcardUrl: "https://cdn.sanity.io/images/test/production/test.jpg",
    postcardAlt: "Test postcard",
    storySlug: "test-story",
    storyTitle: "Test Story",
  };

  it("renders the hero section", () => {
    render(<DeskHero {...defaultProps} />);
    const section = document.querySelector(".desk-hero");
    expect(section).toBeTruthy();
  });

  it("renders a link to the story", () => {
    render(<DeskHero {...defaultProps} />);
    const link = screen.getByRole("link", { name: /test story/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/stories/test-story");
  });

  it("renders the postcard image with correct alt text", () => {
    render(<DeskHero {...defaultProps} />);
    const img = screen.getByAltText("Test postcard");
    expect(img).toBeTruthy();
  });
});
