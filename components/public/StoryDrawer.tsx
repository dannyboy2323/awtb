'use client'

import Image from 'next/image'
import { PanelsTopLeft } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { analyticsEvents } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/** A published story rendered as a postcard inside the reader drawer. */
export interface StoryDrawerItem {
  slug: string
  title: string
  postcardUrl: string
}

/** Props for the story-only postcard navigation drawer. */
export interface StoryDrawerProps {
  currentSlug: string
  stories: StoryDrawerItem[]
}

/**
 * Renders a hidden-by-default shadcn Sheet for moving between ordered stories.
 *
 * Story names remain available to assistive technology, while the visible
 * navigation contains postcard artwork only.
 */
export default function StoryDrawer({ currentSlug, stories }: StoryDrawerProps) {
  const [open, setOpen] = useState(false)
  const currentIndex = stories.findIndex((story) => story.slug === currentSlug)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          className="dark fixed top-1/2 left-2 z-40 -translate-y-1/2 rounded-full shadow-lg"
          aria-label="Open story navigation"
          data-analytics-event={analyticsEvents.storyDrawerOpened}
        >
          <PanelsTopLeft />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="dark border-border bg-background text-foreground w-[min(90vw,28rem)] gap-0 p-0 sm:max-w-md"
        data-testid="story-drawer"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Choose a story</SheetTitle>
          <SheetDescription>Postcards are ordered from the first story onward.</SheetDescription>
        </SheetHeader>

        <nav
          aria-label="Story navigation"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-12"
        >
          {stories.map((story, index) => {
            const isCurrent = index === currentIndex
            const isRead = currentIndex >= 0 && index < currentIndex

            return (
              <Button
                key={story.slug}
                variant="outline"
                className={cn(
                  'border-border bg-card text-card-foreground h-auto w-full overflow-hidden p-1 shadow-sm',
                  isCurrent && 'border-primary bg-accent ring-ring ring-2',
                  isRead && 'opacity-60'
                )}
                asChild
              >
                <a
                  href={`/stories/${story.slug}`}
                  aria-label={`Read ${story.title}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  data-story-state={isCurrent ? 'current' : isRead ? 'read' : 'unread'}
                  data-analytics-event={analyticsEvents.storyDrawerStoryOpened}
                >
                  <Image
                    src={story.postcardUrl}
                    alt=""
                    width={720}
                    height={480}
                    sizes="(max-width: 640px) 86vw, 416px"
                    className="h-auto w-full rounded-md object-contain"
                  />
                </a>
              </Button>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
