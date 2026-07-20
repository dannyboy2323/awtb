import * as Sentry from '@sentry/nextjs'

import { createStoryEpub, type EpubBodyBlock, type EpubStory } from '@/lib/epub'
import { getFeaturedStorySlug } from '@/lib/edge-config'
import { sanityFetch } from '@/sanity/lib/live'
import { storyBySlugQuery, type StoryBySlugQueryResult } from '@/sanity/lib/queries'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const E2E_STORY: EpubStory = {
  id: 'e2e-featured-story',
  slug: 'e2e-featured-story',
  title: 'E2E Featured Story',
  publishedAt: '2026-01-01T00:00:00.000Z',
  coverImage: null,
  body: [
    {
      _type: 'block',
      style: 'normal',
      children: [{ text: 'A deterministic story used to verify EPUB downloads.' }],
    },
  ],
}

/** Maximum production time allowed for image download and EPUB assembly. */
export const maxDuration = 60

function normalizeStory(story: NonNullable<StoryBySlugQueryResult>, slug: string): EpubStory {
  return {
    id: story._id,
    slug,
    title: story.title ?? 'Untitled Story',
    publishedAt: story.publishedAt,
    coverImage: story.coverImage?.asset?.url
      ? {
          url: story.coverImage.asset.url,
          alt: story.coverImage.alt,
        }
      : null,
    body: (story.body ?? []) as EpubBodyBlock[],
  }
}

/**
 * Generates an offline EPUB for the requested story or the current featured story.
 *
 * The optional `slug` query parameter is validated before Sanity is queried. In
 * browser-test mode, a deterministic fixture exercises the complete download path.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const requestedSlug = new URL(request.url).searchParams.get('slug')
    if (requestedSlug && !SLUG_PATTERN.test(requestedSlug)) {
      return Response.json({ error: 'Invalid story slug' }, { status: 400 })
    }

    const slug =
      requestedSlug ??
      (process.env.E2E_TEST === 'true' ? E2E_STORY.slug : await getFeaturedStorySlug())

    if (!slug) {
      return Response.json({ error: 'No featured story is configured' }, { status: 404 })
    }

    let story: EpubStory | null
    if (process.env.E2E_TEST === 'true' && slug === E2E_STORY.slug) {
      story = E2E_STORY
    } else {
      const { data } = await sanityFetch({ query: storyBySlugQuery, params: { slug } })
      story = data ? normalizeStory(data as NonNullable<StoryBySlugQueryResult>, slug) : null
    }

    if (!story) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    const epub = await createStoryEpub(story)
    return new Response(Buffer.from(epub), {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Disposition': `attachment; filename="${story.slug}.epub"`,
        'Content-Length': String(epub.byteLength),
        'Content-Type': 'application/epub+zip',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: 'Unable to generate EPUB' }, { status: 500 })
  }
}
