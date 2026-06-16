/**
 * Landing page — Postcard Stories
 *
 * Above the fold: DeskHero with the featured story's postcard centered
 * on the photorealistic desk background.
 *
 * Below the fold: Responsive postcard grid of all published stories,
 * revealed naturally as the user scrolls past the hero section.
 */

import { SanityLive } from "@/sanity/lib/live";
import { sanityFetch } from "@/sanity/lib/live";
import { featuredStoryQuery, allStoriesQuery } from "@/sanity/lib/queries";
import { getFeaturedStorySlug } from "@/lib/edge-config";
import { urlForImage } from "@/sanity/lib/utils";
import DeskHero from "@/components/public/DeskHero";
import PostcardGrid from "@/components/public/PostcardGrid";

export default async function LandingPage() {
  // Resolve the featured story slug from Edge Config (< 1ms, edge-replicated)
  const featuredSlug = await getFeaturedStorySlug();

  // Fetch featured story and all stories in parallel
  const [featuredResult, allStoriesResult] = await Promise.all([
    featuredSlug
      ? sanityFetch({
          query: featuredStoryQuery,
          params: { slug: featuredSlug },
        })
      : Promise.resolve({ data: null }),
    sanityFetch({ query: allStoriesQuery }),
  ]);

  const featured = featuredResult.data;
  const allStories = allStoriesResult.data ?? [];

  // Stories shown in the grid exclude the featured one (it's already above the fold)
  const gridStories = featured
    ? allStories.filter((s) => s.slug !== featuredSlug)
    : allStories;

  return (
    <>
      {/* Above the fold: desk hero with featured postcard */}
      {featured?.postcard ? (
        <DeskHero
          postcardUrl={
            urlForImage(featured.postcard)?.width(800).format("webp").url() ??
            ""
          }
          postcardAlt={
            featured.postcard.alt ?? featured.title ?? "Featured story postcard"
          }
          storySlug={featured.slug ?? ""}
          storyTitle={featured.title ?? ""}
        />
      ) : (
        // Fallback if no featured story is set yet
        <div className="desk-hero flex items-center justify-center">
          <p className="text-white text-lg opacity-60">
            No featured story selected
          </p>
        </div>
      )}

      {/* Below the fold: all other story postcards */}
      {gridStories.length > 0 && <PostcardGrid stories={gridStories} />}

      {/* Enables Live Content API for real-time Studio preview */}
      <SanityLive />
    </>
  );
}
