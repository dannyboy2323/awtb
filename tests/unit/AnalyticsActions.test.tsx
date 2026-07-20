import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnalyticsActions } from '@/components/shared/AnalyticsActions'
import { analyticsEvents } from '@/lib/analytics'

const capture = vi.fn()

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture }),
}))

describe('AnalyticsActions', () => {
  beforeEach(() => {
    capture.mockClear()
  })

  it('captures a semantic event from a nested click target', () => {
    render(
      <>
        <AnalyticsActions />
        <button aria-label="Read example" data-analytics-event={analyticsEvents.storyOpened}>
          <span>Open</span>
        </button>
      </>
    )

    fireEvent.click(screen.getByText('Open'))

    expect(capture).toHaveBeenCalledWith(analyticsEvents.storyOpened, {
      destination: undefined,
      label: 'Read example',
    })
  })

  it('ignores clicks without semantic metadata', () => {
    render(
      <>
        <AnalyticsActions />
        <button>Untracked fixture</button>
      </>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(capture).not.toHaveBeenCalled()
  })

  it('captures Escape as a semantic keyboard action', () => {
    render(
      <>
        <AnalyticsActions />
        <div tabIndex={-1} data-analytics-event={analyticsEvents.lightboxClosed}>
          Lightbox
        </div>
      </>
    )

    fireEvent.keyDown(screen.getByText('Lightbox'), { key: 'Escape' })
    expect(capture).toHaveBeenCalledWith(analyticsEvents.lightboxClosed, {
      destination: undefined,
      label: 'Lightbox',
    })
  })
})
