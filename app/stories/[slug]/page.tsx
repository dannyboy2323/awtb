/**
 * Story reader page — /stories/[slug]
 *
 * Server Component that fetches the full story from Sanity (all pages + panels)
 * and passes the data to the client-side StoryReader for rendering.
 *
 * Route: /stories/[slug]
 * Revalidated on demand by the Sanity webhook via /api/revalidate.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import {
  storyBySlugQuery,
  type StoryBySlugQueryResult,
} from "@/sanity/lib/queries";
import { SanityLive } from "@/sanity/lib/live";
import StoryReader from "@/components/public/StoryReader";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates page metadata (title, description) from Sanity story data.
 */
export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await sanityFetch({
    query: storyBySlugQuery,
    params: { slug },
  });
  const story = data as StoryBySlugQueryResult;

  if (!story) {
    return { title: "Story not found" };
  }

  return {
    title: story.title ?? "Story",
    description: `Read "${story.title}" — Adventures With The Bull`,
  };
}

/**
 * Story reader page server component.
 * Fetches story + all pages + panels from Sanity, renders StoryReader.
 * Returns 404 if the slug doesn't match any published story.
 */
export default async function StoryReaderPage({ params }: StoryPageProps) {
  const { slug } = await params;

  const { data } = await sanityFetch({
    query: storyBySlugQuery,
    params: { slug },
  });
  const story = data as StoryBySlugQueryResult;

  if (!story) {
    notFound();
  }

  const pages = story.pages ?? [];

  return (
    <>
      <StoryReader title={story.title ?? "Untitled Story"} pages={pages} />
      {/* Enables Live Content API for real-time Studio preview */}
      <SanityLive />
    </>
  );
}
