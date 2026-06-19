/**
 * Feature flags configuration using Vercel Flags SDK + PostHog adapter.
 *
 * Define all feature flags here. They are evaluated at the edge using
 * PostHog as the backend, with results cached in Vercel's Edge Network.
 *
 * @example Usage in Server Components:
 * ```ts
 * import { showNewLandingPage } from '@/lib/flags'
 * const isEnabled = await showNewLandingPage()
 * ```
 */

import { flag } from 'flags/next'
import { postHogAdapter } from '@flags-sdk/posthog'

/**
 * Example feature flag for A/B testing the landing page.
 * Replace 'show-new-landing-page' with your real flag key from PostHog.
 */
export const showNewLandingPage = flag<boolean>({
  key: 'show-new-landing-page',
  adapter: postHogAdapter.isFeatureEnabled(),
  defaultValue: false,
  description: 'Show the new landing page variant (A/B test)',
  origin: 'https://app.posthog.com',
})
