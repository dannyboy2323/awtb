/**
 * PostHog client configuration.
 *
 * - posthog-js: browser-side analytics, session replay, pageview tracking
 * - posthog-node: server-side event tracking for Server Components and API routes
 *
 * @example Browser usage (in Client Components):
 * ```ts
 * import { usePostHog } from 'posthog-js/react'
 * const posthog = usePostHog()
 * posthog.capture('story_opened', { slug: 'test-story' })
 * ```
 *
 * @example Server usage (in Server Components and API routes):
 * ```ts
 * import { serverPostHog } from '@/lib/posthog'
 * await serverPostHog.capture({ distinctId: userId, event: 'page_viewed' })
 * ```
 */

import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client.
 * Use this in Server Components, API routes, and Server Actions.
 */
export const serverPostHog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0,
});
