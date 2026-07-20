'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

import type { AnalyticsEvent } from '@/lib/analytics'

/**
 * Captures semantic product events declared with `data-analytics-event`.
 *
 * A single delegated listener covers links and buttons rendered by Server
 * Components without turning them into client components. PostHog autocapture
 * remains enabled for low-level interaction diagnostics.
 */
export function AnalyticsActions() {
  const posthog = usePostHog()

  useEffect(() => {
    const capture = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const action = target.closest<HTMLElement>('[data-analytics-event]')
      if (!action) return

      const eventName = action.dataset.analyticsEvent as AnalyticsEvent | undefined
      if (!eventName) return

      posthog.capture(eventName, {
        destination: action.getAttribute('href') ?? undefined,
        label: action.getAttribute('aria-label') ?? action.textContent?.trim().slice(0, 100),
      })
    }

    document.addEventListener('click', capture)
    const captureEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') capture(event)
    }
    document.addEventListener('keydown', captureEscape)

    return () => {
      document.removeEventListener('click', capture)
      document.removeEventListener('keydown', captureEscape)
    }
  }, [posthog])

  return null
}
