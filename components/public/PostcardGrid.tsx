/**
 * PostcardGrid — below-the-fold grid of all story postcards.
 * Renders after the user scrolls past the DeskHero section.
 */

import Image from 'next/image'
import Link from 'next/link'
import type { SanityImageSource } from '@sanity/image-url'

import { analyticsEvents } from '@/lib/analytics'
import { urlForImage } from '@/sanity/lib/utils'

/** Published Sanity story fields required to build a postcard-grid item. */
export interface PostcardGridStorySource {
  _id: string
  title?: string | null
  slug?: string | null
  postcard?: {
    alt?: string | null
    asset?: unknown
  } | null
}

/** Minimal published story data rendered by the postcard grid. */
export interface PostcardGridStory {
  _id: string
  title: string
  slug: string
  postcardUrl: string
  postcardAlt: string
}

/** Props for the below-the-fold published-story grid. */
export interface PostcardGridProps {
  stories: PostcardGridStory[]
}

/** Resolves publishable Sanity stories into optimized postcard presentation data. */
export function buildPostcardGridStories(
  stories: readonly PostcardGridStorySource[],
  featuredSlug: string | null
): PostcardGridStory[] {
  return stories.flatMap((story) => {
    if (!story.slug || !story.postcard?.asset || story.slug === featuredSlug) return []

    const title = story.title ?? 'Untitled story'
    return [
      {
        _id: story._id,
        title,
        slug: story.slug,
        postcardUrl: urlForImage(story.postcard as SanityImageSource)
          .width(1200)
          .format('webp')
          .url(),
        postcardAlt: story.postcard.alt ?? story.title ?? 'Story postcard',
      },
    ]
  })
}

/** Renders each published story as a linked, responsive postcard image. */
export default function PostcardGrid({ stories }: PostcardGridProps) {
  return (
    <section className="postcard-grid bg-background px-4 py-16" aria-label="More stories">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stories.map((story) => (
            <Link
              key={story._id}
              href={`/stories/${story.slug}`}
              aria-label={`Read "${story.title}"`}
              data-analytics-event={analyticsEvents.storyOpened}
              data-testid="postcard-grid-item"
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-offset-background transition hover:border-ring hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="relative aspect-3/2 w-full overflow-hidden bg-muted">
                <Image
                  src={story.postcardUrl}
                  alt={story.postcardAlt}
                  fill
                  sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2rem), (max-width: 1279px) calc(33vw - 2rem), 304px"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
