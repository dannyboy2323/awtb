'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookDown, ChevronDown, ChevronUp, Share2, Star } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { analyticsEvents } from '@/lib/analytics'
import { getShareDestinations, type ShareDestination } from '@/lib/share'
import { cn } from '@/lib/utils'

/** Configuration accepted by the global floating navigation bar. */
export interface FloatingNavProps {
  /** Delay before the bar hides after the pointer leaves it. */
  autoHideDelay?: number
}

const DEFAULT_AUTO_HIDE_DELAY = 1800
const SCROLL_DELTA = 8
const TOP_THRESHOLD = 24

function pageSnapshot(): { title: string; url: string } {
  return {
    title: document.title || 'Adventures With The Bull',
    url: window.location.href,
  }
}

function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

/**
 * Renders the global shadcn toolbar without affecting document flow.
 *
 * The toolbar hides while scrolling down or shortly after pointer exit, then
 * reappears on upward scroll, top-edge hover, keyboard focus, or reveal click.
 */
export default function FloatingNav({ autoHideDelay = DEFAULT_AUTO_HIDE_DELAY }: FloatingNavProps) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [nativeShareAvailable] = useState(
    () =>
      typeof window !== 'undefined' && typeof navigator.share === 'function' && isCoarsePointer()
  )
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollY = useRef(0)

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const showNavigation = useCallback(() => {
    clearHideTimer()
    setVisible(true)
  }, [clearHideTimer])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    hideTimer.current = setTimeout(() => setVisible(false), autoHideDelay)
  }, [autoHideDelay, clearHideTimer])

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      const nextY = window.scrollY
      const delta = nextY - lastScrollY.current

      if (nextY <= TOP_THRESHOLD || delta < -SCROLL_DELTA) {
        showNavigation()
      } else if (delta > SCROLL_DELTA) {
        clearHideTimer()
        setVisible(false)
      }
      lastScrollY.current = nextY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearHideTimer()
      window.removeEventListener('scroll', onScroll)
    }
  }, [clearHideTimer, showNavigation])

  const copyCurrentUrl = useCallback(async (message: string) => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success(message)
    } catch {
      toast.error('Copy failed. Select the address in your browser to copy it.')
    }
  }, [])

  const selectShareDestination = useCallback(
    (destination: ShareDestination) => {
      if (destination.kind === 'print') {
        window.print()
      } else if (destination.kind === 'copy') {
        void copyCurrentUrl(
          destination.id === 'instagram' ? 'Link copied — paste it into Instagram.' : 'Link copied.'
        )
      } else {
        window.open(destination.href, '_blank', 'noopener,noreferrer')
      }
    },
    [copyCurrentUrl]
  )

  const handleShareClick = useCallback(async () => {
    const snapshot = pageSnapshot()
    if (!nativeShareAvailable) {
      setShareOpen(true)
      return
    }

    try {
      await navigator.share({
        title: snapshot.title,
        text: `Read ${snapshot.title}`,
        url: snapshot.url,
      })
    } catch (error) {
      // Closing the native sheet is an intentional reader action, not an error.
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error('The system share sheet could not be opened.')
      }
    }
  }, [nativeShareAvailable])

  // Radix opens on pointer-down, before a trigger click fires. Deriving the
  // snapshot from open state guarantees the first portal render has its items.
  const shareSnapshot = shareOpen ? pageSnapshot() : null
  const destinations = shareSnapshot
    ? getShareDestinations(shareSnapshot.url, shareSnapshot.title)
    : []
  const storySlug = pathname.match(/^\/stories\/([^/]+)$/)?.[1]
  const isMarketingRoute = pathname === '/' || pathname === '/about'
  const shortcut =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘D' : 'Ctrl+D'

  // Public marketing and story routes own this chrome. Studio, developer, and
  // other application routes keep their existing route-specific navigation.
  if (!isMarketingRoute && !storySlug) return null

  const epubHref = storySlug ? `/api/epub?slug=${encodeURIComponent(storySlug)}` : null

  return (
    <>
      {/* The invisible top-edge target restores a hidden toolbar on desktop hover. */}
      <div
        className="fixed inset-x-0 top-0 z-90 h-4"
        aria-hidden="true"
        onPointerEnter={showNavigation}
      />

      <nav
        className={cn(
          'dark bg-background/95 text-foreground border-border fixed inset-x-0 top-0 z-100 flex w-screen items-center justify-between border-b px-2 py-1.5 shadow-2xl backdrop-blur-md transition-[transform,opacity] duration-300',
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        )}
        aria-label={storySlug ? 'Reader navigation' : 'Site navigation'}
        aria-hidden={!visible}
        inert={!visible}
        tabIndex={-1}
        onPointerEnter={showNavigation}
        onPointerLeave={scheduleHide}
        data-testid="floating-nav"
      >
        <Button variant="ghost" size="icon-lg" asChild>
          <Link
            href="/"
            aria-label="Adventures With The Bull home"
            data-analytics-event={analyticsEvents.navHomeOpened}
          >
            <Image src="/icon2.png" alt="" width={32} height={32} priority />
          </Link>
        </Button>

        {storySlug && epubHref ? (
          <div className="flex items-center gap-1">
            <DropdownMenu
              open={shareOpen}
              onOpenChange={(open: boolean) => {
                if (!nativeShareAvailable) setShareOpen(open)
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Share this page"
                  onClick={() => void handleShareClick()}
                  data-analytics-event={analyticsEvents.shareOpened}
                >
                  <Share2 />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="dark border-border max-h-[min(70vh,30rem)] w-60 border"
              >
                <DropdownMenuLabel>Share this page</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {destinations.map((destination) => (
                  <DropdownMenuItem
                    key={destination.id}
                    onSelect={() => selectShareDestination(destination)}
                    data-analytics-event={analyticsEvents.shareDestinationOpened}
                  >
                    {destination.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon-lg" asChild>
              <a
                href={epubHref}
                download
                aria-label="Download this story as EPUB"
                data-analytics-event={analyticsEvents.epubDownloaded}
              >
                <BookDown />
              </a>
            </Button>

            <DropdownMenu open={favoritesOpen} onOpenChange={setFavoritesOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Add this page to browser favorites"
                  data-analytics-event={analyticsEvents.favoriteInstructionsOpened}
                >
                  <Star />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark border-border w-72 border">
                <DropdownMenuLabel>Add to browser favorites</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="text-muted-foreground px-2 py-2 text-sm">
                  Press{' '}
                  <kbd className="bg-muted text-foreground rounded px-1.5 py-0.5">{shortcut}</kbd>{' '}
                  to save this page in your browser.
                </div>
                <DropdownMenuItem
                  onSelect={() => void copyCurrentUrl('Link copied.')}
                  data-analytics-event={analyticsEvents.favoriteLinkCopied}
                >
                  Copy page link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="ghost" asChild>
            <Link
              href="/about"
              className="text-foreground font-medium tracking-wide"
              data-analytics-event={analyticsEvents.navAboutOpened}
            >
              ABOUT
            </Link>
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          className="absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-full shadow-lg"
          aria-label="Hide navigation"
          onClick={() => {
            clearHideTimer()
            setVisible(false)
          }}
          data-analytics-event={analyticsEvents.navHidden}
        >
          <ChevronUp />
        </Button>
      </nav>

      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className={cn(
          'dark fixed top-1 left-1/2 z-95 -translate-x-1/2 rounded-full shadow-xl transition-[transform,opacity] duration-300',
          visible ? 'pointer-events-none -translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
        )}
        aria-label="Show navigation"
        onMouseEnter={showNavigation}
        onClick={showNavigation}
        data-analytics-event={analyticsEvents.navRevealed}
      >
        <ChevronDown />
      </Button>
    </>
  )
}
