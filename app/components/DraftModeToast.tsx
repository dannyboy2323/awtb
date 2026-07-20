'use client'

import { useIsPresentationTool } from 'next-sanity/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { usePostHog } from 'posthog-js/react'
import { disableDraftMode } from '@/app/actions'
import { analyticsEvents } from '@/lib/analytics'

/** Displays the draft-mode status and provides an exit action. */
export default function DraftModeToast() {
  const isPresentationTool = useIsPresentationTool()
  const router = useRouter()
  const posthog = usePostHog()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (isPresentationTool === false) {
      /**
       * We delay the toast in case we're inside Presentation Tool
       */
      const toastId = toast('Draft Mode Enabled', {
        description: 'Content is live, refreshing automatically',
        duration: Infinity,
        action: {
          label: 'Disable',
          onClick: async () => {
            posthog.capture(analyticsEvents.draftModeDisabled)
            await disableDraftMode()
            startTransition(() => {
              router.refresh()
            })
          },
        },
      })
      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [router, isPresentationTool, posthog])

  useEffect(() => {
    if (pending) {
      const toastId = toast.loading('Disabling draft mode...')
      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [pending])

  return null
}
