/**
 * Story reader page — /stories/[slug]
 *
 * Server Component that fetches the full story from Sanity and passes
 * it to the client-side StoryReader for rendering.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { storyBySlugQuery, type StoryBySlugQueryResult } from '@/sanity/lib/queries'
import { SanityLive } from '@/sanity/lib/live'
import StoryReader from '@/components/public/StoryReader'

interface StoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params
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
  const { data } = await sanityFetch({ query: storyBySlugQuery, params: { slug } })
  const story = data as StoryBySlugQueryResult

  if (!story) notFound()

  const pages = (story.pages ?? []).map((p, i) => ({
    _id: `page-${i}`,
    _key: p._key,
    prose: p.prose,
  }))

  return (
    <>
      <StoryReader
        title={story.title ?? 'Untitled Story'}
        coverImage={story.coverImage ?? null}
        pages={pages}
      />
      <SanityLive />
    </>
  )
}
