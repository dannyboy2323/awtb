import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import FloatingNav from '@/components/public/FloatingNav'

const navigation = vi.hoisted(() => ({ pathname: '/stories/test-story' }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
const clipboardWrite = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

vi.mock('sonner', () => ({ toast }))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const imageProps = { ...props }
    delete imageProps.priority
    return createElement('img', imageProps)
  },
}))

function setNavigatorProperty(name: string, value: unknown) {
  Object.defineProperty(navigator, name, { configurable: true, value })
}

function setCoarsePointer(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })
}

async function openShareMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Share this page' }))
  await screen.findByText('Facebook')
}

describe('FloatingNav', () => {
  beforeEach(() => {
    navigation.pathname = '/stories/test-story'
    setCoarsePointer(false)
    setNavigatorProperty('share', undefined)
    setNavigatorProperty('platform', 'MacIntel')
    clipboardWrite.mockReset().mockResolvedValue(undefined)
    setNavigatorProperty('clipboard', { writeText: clipboardWrite })
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
    Object.defineProperty(window, 'open', { configurable: true, value: vi.fn() })
    Object.defineProperty(window, 'print', { configurable: true, value: vi.fn() })
    toast.success.mockClear()
    toast.error.mockClear()
    document.title = 'Test Story'
    window.history.replaceState({}, '', '/stories/test-story')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a floating logo and the three required actions', () => {
    render(<FloatingNav />)

    expect(screen.getByRole('navigation', { name: 'Reader navigation' })).toHaveClass('fixed')
    expect(screen.getByRole('link', { name: 'Adventures With The Bull home' })).toHaveAttribute(
      'href',
      '/'
    )
    expect(screen.getByRole('button', { name: 'Share this page' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Download this story as EPUB' })).toHaveAttribute(
      'href',
      '/api/epub?slug=test-story'
    )
    expect(screen.getByRole('button', { name: 'Add this page to browser favorites' })).toBeVisible()
  })

  it('does not render on the landing page or any other non-story route', () => {
    navigation.pathname = '/'
    const { rerender } = render(<FloatingNav />)
    expect(screen.queryByRole('navigation', { name: 'Reader navigation' })).not.toBeInTheDocument()

    navigation.pathname = '/studio/structure'
    rerender(<FloatingNav />)
    expect(screen.queryByRole('navigation', { name: 'Reader navigation' })).not.toBeInTheDocument()

    navigation.pathname = '/dev/components'
    rerender(<FloatingNav />)
    expect(screen.queryByRole('navigation', { name: 'Reader navigation' })).not.toBeInTheDocument()
  })

  it('opens every desktop sharing option and runs link, print, and copy actions', async () => {
    const user = userEvent.setup()
    setNavigatorProperty('clipboard', { writeText: clipboardWrite })
    render(<FloatingNav />)

    await openShareMenu(user)
    expect(screen.getByText('SMS / Messages')).toBeVisible()
    expect(screen.getByText('Email')).toBeVisible()
    expect(screen.getByText('X')).toBeVisible()
    expect(screen.getByText('Reddit')).toBeVisible()
    expect(screen.getByText('Instagram (copy link)')).toBeVisible()
    expect(screen.getByText('More apps & sites')).toBeVisible()

    await user.click(screen.getByText('Facebook'))
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('add_to/facebook'),
      '_blank',
      'noopener,noreferrer'
    )

    await openShareMenu(user)
    await user.click(screen.getByText('Print'))
    expect(window.print).toHaveBeenCalledOnce()

    await openShareMenu(user)
    await user.click(screen.getByText('Instagram (copy link)'))
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(window.location.href)
      expect(toast.success).toHaveBeenCalledWith('Link copied — paste it into Instagram.')
    })
  })

  it('reports clipboard failures from share and favorite actions', async () => {
    const user = userEvent.setup()
    clipboardWrite.mockRejectedValue(new Error('blocked'))
    setNavigatorProperty('clipboard', { writeText: clipboardWrite })
    render(<FloatingNav />)

    await openShareMenu(user)
    await user.click(screen.getByText('Copy link'))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Copy failed'))
    )

    await user.click(screen.getByRole('button', { name: 'Add this page to browser favorites' }))
    expect(screen.getByText('⌘D')).toBeVisible()
    await user.click(screen.getByText('Copy page link'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2))
  })

  it('uses the native share sheet on coarse-pointer devices', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    setCoarsePointer(true)
    setNavigatorProperty('share', share)
    document.title = ''
    render(<FloatingNav />)

    await user.click(screen.getByRole('button', { name: 'Share this page' }))

    expect(share).toHaveBeenCalledWith({
      title: 'Adventures With The Bull',
      text: 'Read Adventures With The Bull',
      url: window.location.href,
    })
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
  })

  it('ignores native share cancellation and reports other native failures', async () => {
    const user = userEvent.setup()
    const share = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))
      .mockRejectedValueOnce(new Error('unavailable'))
    setCoarsePointer(true)
    setNavigatorProperty('share', share)
    render(<FloatingNav />)

    const trigger = screen.getByRole('button', { name: 'Share this page' })
    await user.click(trigger)
    expect(toast.error).not.toHaveBeenCalled()

    await user.click(trigger)
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('The system share sheet could not be opened.')
    )
  })

  it('hides on pointer exit or downward scroll and reveals on click, hover, or upward scroll', () => {
    vi.useFakeTimers()
    render(<FloatingNav autoHideDelay={50} />)
    const nav = screen.getByRole('navigation', { name: 'Reader navigation' })

    fireEvent.pointerLeave(nav)
    act(() => vi.advanceTimersByTime(50))
    expect(nav).toHaveClass('opacity-0')

    fireEvent.click(screen.getByRole('button', { name: 'Show navigation' }))
    expect(nav).toHaveClass('opacity-100')

    fireEvent.click(screen.getByRole('button', { name: 'Hide navigation' }))
    expect(nav).toHaveClass('opacity-0')
    fireEvent.pointerEnter(document.querySelector('[aria-hidden="true"]') as Element)
    expect(nav).toHaveClass('opacity-100')

    window.scrollY = 100
    fireEvent.scroll(window)
    expect(nav).toHaveClass('opacity-0')
    window.scrollY = 105
    fireEvent.scroll(window)
    expect(nav).toHaveClass('opacity-0')
    window.scrollY = 50
    fireEvent.scroll(window)
    expect(nav).toHaveClass('opacity-100')
    window.scrollY = 0
    fireEvent.scroll(window)
    expect(nav).toHaveClass('opacity-100')
  })

  it('shows the Windows favorites shortcut and clears a pending timer on unmount', async () => {
    const user = userEvent.setup()
    setNavigatorProperty('platform', 'Win32')
    const { unmount } = render(<FloatingNav autoHideDelay={100} />)
    const favorites = screen.getByRole('button', { name: 'Add this page to browser favorites' })

    await user.click(favorites)
    expect(screen.getByText('Ctrl+D')).toBeVisible()

    fireEvent.pointerLeave(screen.getByTestId('floating-nav'))
    unmount()
  })
})
