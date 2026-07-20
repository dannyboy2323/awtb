'use client'

import { isCorsOriginError } from 'next-sanity/live'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'
import { toast } from 'sonner'
import { analyticsEvents } from '@/lib/analytics'

/** Reports Sanity Live client errors with a useful browser-console message. */
export function handleError(error: unknown) {
  if (isCorsOriginError(error)) {
    // If the error is a CORS origin error, let's display that specific error.
    const { addOriginUrl } = error
    toast.error(`Sanity Live couldn't connect`, {
      description: `Your origin is blocked by CORS policy`,
      duration: Infinity,
      action: addOriginUrl
        ? {
            label: 'Manage',
            onClick: () => {
              posthog.capture(analyticsEvents.sanityCorsManagementOpened)
              window.open(addOriginUrl.toString(), '_blank')
            },
          }
        : undefined,
    })
  } else if (error instanceof Error) {
    Sentry.captureException(error)
    console.error(error)
    toast.error(error.name, { description: error.message, duration: Infinity })
  } else {
    Sentry.captureException(error)
    console.error(error)
    toast.error('Unknown error', {
      description: 'Check the console for more details',
      duration: Infinity,
    })
  }
}
