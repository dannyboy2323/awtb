import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const posthog = vi.hoisted(() => ({
  capture: vi.fn(),
  init: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthog }))
vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  usePostHog: () => posthog,
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/stories/example',
  useSearchParams: () => new URLSearchParams('page=2'),
}))
vi.mock('@/components/shared/AnalyticsActions', () => ({
  AnalyticsActions: () => null,
}))

describe('PostHogProvider', () => {
  beforeEach(() => {
    vi.resetModules()
    posthog.capture.mockClear()
    posthog.init.mockClear()
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST
  })

  it('does not initialize PostHog when a test environment has no token', async () => {
    await import('@/components/shared/PostHogProvider')
    expect(posthog.init).not.toHaveBeenCalled()
  })

  it('initializes PostHog with privacy-safe recording settings', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'phc_test'
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://analytics.example.com'

    await import('@/components/shared/PostHogProvider')

    expect(posthog.init).toHaveBeenCalledWith('phc_test', {
      api_host: 'https://analytics.example.com',
      capture_pageleave: true,
      capture_pageview: false,
      session_recording: { maskAllInputs: true },
    })
  })

  it('captures a semantic pageview after navigation state is available', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'phc_test'
    const { PostHogProvider } = await import('@/components/shared/PostHogProvider')

    render(
      <PostHogProvider>
        <p>Story</p>
      </PostHogProvider>
    )

    await waitFor(() => {
      expect(posthog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: 'http://localhost:3000/stories/example?page=2',
      })
    })
  })
})
