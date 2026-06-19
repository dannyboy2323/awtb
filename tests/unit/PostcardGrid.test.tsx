import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostcardGrid from '@/components/public/PostcardGrid'

/**
 * PostcardGrid component tests.
 * Tests rendering with various story counts including empty state.
 */

const SAMPLE_STORIES = [
  {
    _id: 'story-1',
    title: 'The Bronze Bull',
    slug: 'the-bronze-bull',
    publishedAt: '2026-01-15T00:00:00Z',
    postcard: { alt: 'Bronze bull postcard', asset: null },
  },
  {
    _id: 'story-2',
    title: 'Adventures With the Bull',
    slug: 'adventures-with-the-bull',
    publishedAt: '2026-02-20T00:00:00Z',
    postcard: { alt: 'Adventures postcard', asset: null },
  },
]

describe('PostcardGrid', () => {
  it('renders all stories', () => {
    render(<PostcardGrid stories={SAMPLE_STORIES} />)
    expect(screen.getByText('The Bronze Bull')).toBeTruthy()
    expect(screen.getByText('Adventures With the Bull')).toBeTruthy()
  })

  it('renders empty state without crashing', () => {
    const { container } = render(<PostcardGrid stories={[]} />)
    expect(container).toBeTruthy()
  })

  it('renders the correct number of story items', () => {
    render(<PostcardGrid stories={SAMPLE_STORIES} />)
    const items = document.querySelectorAll('.postcard-container')
    expect(items.length).toBe(2)
  })
})
