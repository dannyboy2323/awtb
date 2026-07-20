/**
 * Story reader page — /stories/[slug]
 *
 * Server Component that fetches the full story from Sanity and passes
 * it to the client-side StoryReader for rendering.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import {
  allStoriesQuery,
  storyBySlugQuery,
  type StoryBySlugQueryResult,
} from '@/sanity/lib/queries'
import { SanityLive } from '@/sanity/lib/live'
import StoryDrawer, { type StoryDrawerItem } from '@/components/public/StoryDrawer'
import StoryReader from '@/components/public/StoryReader'
import { urlForImage } from '@/sanity/lib/utils'

interface StoryPageProps {
  params: Promise<{ slug: string }>
}

const E2E_STORIES: StoryDrawerItem[] = [
  {
    slug: 'e2e-first-story',
    title: 'E2E First Story',
    postcardUrl: '/icon1.png',
  },
  {
    slug: 'e2e-featured-story',
    title: 'E2E Featured Story',
    postcardUrl: '/icon.png',
  },
  {
    slug: 'e2e-third-story',
    title: 'E2E Third Story',
    postcardUrl: '/icon2.png',
  },
]

/** Builds social and browser metadata for a story reader route. */
export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const e2eStory = E2E_STORIES.find((story) => story.slug === slug)
  if (process.env.E2E_TEST === 'true' && e2eStory) {
    return { title: e2eStory.title }
  }

  const { data } = await sanityFetch({ query: storyBySlugQuery, params: { slug } })
  const story = data as StoryBySlugQueryResult

  if (!story) return { title: 'Story not found' }

  return {
    title: story.title ?? 'Story',
    description: `Read "${story.title}" — Adventures With The Bull`,
  }
}

export default async function StoryReaderPage({ params }: StoryPageProps) {
  const { slug } = await params
  const e2eStory = E2E_STORIES.find((story) => story.slug === slug)
  if (process.env.E2E_TEST === 'true' && e2eStory) {
    return (
      <>
        <StoryDrawer currentSlug={slug} stories={E2E_STORIES} />
        <StoryReader
          title={e2eStory.title}
          coverImage={null}
          coverImagePortrait={null}
          body={Array.from({ length: 24 }, (_, index) => ({
            _type: 'block',
            _key: `e2e-paragraph-${index}`,
            style: 'normal',
            markDefs: [],
            children: [
              {
                _type: 'span',
                _key: `e2e-span-${index}`,
                marks: [],
                text: `E2E story paragraph ${index + 1} verifies the complete scrolling reader experience.`,
              },
            ],
          }))}
        />
      </>
    )
  }

  const [storyResult, allStoriesResult] = await Promise.all([
    sanityFetch({ query: storyBySlugQuery, params: { slug } }),
    sanityFetch({ query: allStoriesQuery }),
  ])
  const story = storyResult.data as StoryBySlugQueryResult

  if (!story) notFound()

  const drawerStories = (allStoriesResult.data ?? []).map((drawerStory) => ({
    slug: drawerStory.slug,
    title: drawerStory.title,
    postcardUrl: urlForImage(drawerStory.postcard)?.width(720).format('webp').url() ?? '/icon.png',
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (story as any).body ?? null

  return (
    <>
      <StoryDrawer currentSlug={slug} stories={drawerStories} />
      <StoryReader
        title={story.title ?? 'Untitled Story'}
        coverImage={story.coverImage ?? null}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        coverImagePortrait={(story as any).coverImagePortrait ?? null}
        body={body}
      />
      <SanityLive />
    </>
  )
}
// force redeploy Tue Jun 30 20:15:44 EDT 2026
