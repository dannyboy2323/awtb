'use server'

import { draftMode } from 'next/headers'

/** Disables Next.js draft mode and returns the visitor to published content. */
export async function disableDraftMode() {
  'use server'
  await Promise.allSettled([
    (await draftMode()).disable(),
    // Simulate a delay to show the loading state
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ])
}
