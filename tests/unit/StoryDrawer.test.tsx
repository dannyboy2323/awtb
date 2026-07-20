import { fireEvent, render, screen, within } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import StoryDrawer, { type StoryDrawerItem } from '@/components/public/StoryDrawer'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const imageProps = { ...props }
    delete imageProps.priority
    return createElement('img', imageProps)
  },
}))

const STORIES: StoryDrawerItem[] = [
  { slug: 'story-one', title: 'Story One', postcardUrl: '/one.png' },
  { slug: 'story-two', title: 'Story Two', postcardUrl: '/two.png' },
  { slug: 'story-three', title: 'Story Three', postcardUrl: '/three.png' },
]

describe('StoryDrawer', () => {
  it('starts hidden and opens an ordered, postcard-only story list', () => {
    render(<StoryDrawer currentSlug="story-two" stories={STORIES} />)

    expect(screen.queryByTestId('story-drawer')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open story navigation' }))

    const navigation = screen.getByRole('navigation', { name: 'Story navigation' })
    const links = within(navigation).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/stories/story-one',
      '/stories/story-two',
      '/stories/story-three',
    ])
    const postcards = navigation.querySelectorAll('img')
    expect(postcards).toHaveLength(3)
    expect([...postcards].every((image) => image.getAttribute('alt') === '')).toBe(true)
    expect(navigation).toHaveTextContent('')
  })

  it('darkens prior stories, highlights the current story, and closes after selection', () => {
    render(<StoryDrawer currentSlug="story-two" stories={STORIES} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open story navigation' }))

    const first = screen.getByRole('link', { name: 'Read Story One' })
    const current = screen.getByRole('link', { name: 'Read Story Two' })
    const future = screen.getByRole('link', { name: 'Read Story Three' })

    expect(first).toHaveAttribute('data-story-state', 'read')
    expect(first).toHaveClass('opacity-60')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current).toHaveAttribute('data-story-state', 'current')
    expect(current).toHaveClass('border-primary', 'bg-accent', 'ring-2', 'ring-ring')
    expect(future).toHaveAttribute('data-story-state', 'unread')
    expect(future).not.toHaveClass('opacity-60')

    future.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(future)
    expect(screen.queryByTestId('story-drawer')).not.toBeInTheDocument()
  })

  it('leaves every story unread when the current slug is outside the list', () => {
    render(<StoryDrawer currentSlug="missing-story" stories={STORIES} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open story navigation' }))

    const links = screen.getAllByRole('link')
    expect(links.every((link) => link.getAttribute('data-story-state') === 'unread')).toBe(true)
    expect(links.every((link) => !link.hasAttribute('aria-current'))).toBe(true)
  })
})
