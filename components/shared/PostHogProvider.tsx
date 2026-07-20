/**
 * PostHog browser provider.
 *
 * Wraps the application with PostHog's React context so all Client Components
 * can access the PostHog instance via usePostHog().
 *
 * Automatically tracks:
 * - Pageviews on route changes (via Next.js usePathname)
 * - Session replays
 * - Feature flag evaluations
 *
 * Must be rendered in a Client Component — mounted in app/layout.tsx.
 */
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { AnalyticsActions } from '@/components/shared/AnalyticsActions'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (pathname && ph) {
      let url = window.location.origin + pathname
      const search = searchParams?.toString()
      if (search) url += `?${search}`
      ph.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, ph])

  return null
}

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

if (typeof window !== 'undefined' && posthogToken) {
  posthog.init(posthogToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // we handle this manually above
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
    },
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <AnalyticsActions />
      {children}
    </PHProvider>
  )
}
