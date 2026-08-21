import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import PostcardGrid, {
  buildPostcardGridStories,
  type PostcardGridStory,
  type PostcardGridStorySource,
} from '@/components/public/PostcardGrid'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const imageProps = { ...props }
    delete imageProps.fill
    return createElement('img', imageProps)
  },
}))

/**
 * PostcardGrid component tests.
 * Tests rendering with various story counts including empty state.
 */

const SAMPLE_STORIES: PostcardGridStory[] = [
  {
    _id: 'story-1',
    title: 'The Bronze Bull',
    slug: 'the-bronze-bull',
    postcardUrl: 'https://cdn.sanity.io/images/test/production/bronze.webp',
    postcardAlt: 'Bronze bull postcard',
  },
  {
    _id: 'story-2',
    title: 'Adventures With the Bull',
    slug: 'adventures-with-the-bull',
    postcardUrl: 'https://cdn.sanity.io/images/test/production/adventures.webp',
    postcardAlt: 'Adventures postcard',
  },
]

const SANITY_STORIES: PostcardGridStorySource[] = [
  {
    _id: 'featured-story',
    title: 'Featured Story',
    slug: 'featured-story',
    postcard: {
      alt: 'Featured postcard',
      asset: { _ref: 'image-featured-1200x800-jpg', _type: 'reference' },
    },
  },
  {
    _id: 'story-2',
    title: 'B.I.G. Poppa',
    slug: 'big-poppa',
    postcard: {
      alt: 'postcard from brooklyn',
      asset: { _ref: 'image-bigpoppa-4480x2998-png', _type: 'reference' },
    },
  },
]

describe('PostcardGrid', () => {
  it('renders every story as a linked postcard image', () => {
    render(<PostcardGrid stories={SAMPLE_STORIES} />)

    const firstPostcard = screen.getByRole('img', { name: 'Bronze bull postcard' })
    const secondPostcard = screen.getByRole('img', { name: 'Adventures postcard' })
    expect(firstPostcard).toHaveAttribute('src', SAMPLE_STORIES[0].postcardUrl)
    expect(secondPostcard).toHaveAttribute('src', SAMPLE_STORIES[1].postcardUrl)
    expect(screen.getByRole('link', { name: 'Read "The Bronze Bull"' })).toHaveAttribute(
      'href',
      '/stories/the-bronze-bull'
    )
    expect(screen.getByRole('link', { name: 'Read "Adventures With the Bull"' })).toHaveAttribute(
      'href',
      '/stories/adventures-with-the-bull'
    )
  })

  it('renders empty state without crashing', () => {
    const { container } = render(<PostcardGrid stories={[]} />)
    expect(container).toBeTruthy()
  })

  it('renders the correct number of story items', () => {
    render(<PostcardGrid stories={SAMPLE_STORIES} />)
    expect(screen.getAllByTestId('postcard-grid-item')).toHaveLength(2)
  })

  it('maps non-featured Sanity assets to optimized linked-card data', () => {
    expect(buildPostcardGridStories(SANITY_STORIES, 'featured-story')).toEqual([
      {
        _id: 'story-2',
        title: 'B.I.G. Poppa',
        slug: 'big-poppa',
        postcardAlt: 'postcard from brooklyn',
        postcardUrl: expect.stringMatching(
          /cdn\.sanity\.io\/images\/.*\/bigpoppa-4480x2998\.png\?w=1200&fm=webp/
        ),
      },
    ])
  })

  it('skips incomplete stories and supplies accessible text fallbacks', () => {
    const incompleteStories: PostcardGridStorySource[] = [
      { _id: 'missing-slug', title: 'Missing Slug', postcard: SANITY_STORIES[1].postcard },
      { _id: 'missing-postcard', title: 'Missing Postcard', slug: 'missing-postcard' },
      {
        _id: 'untitled',
        slug: 'untitled',
        postcard: {
          asset: { _ref: 'image-untitled-1200x800-jpg', _type: 'reference' },
        },
      },
    ]

    expect(buildPostcardGridStories(incompleteStories, null)).toEqual([
      expect.objectContaining({
        _id: 'untitled',
        title: 'Untitled story',
        slug: 'untitled',
        postcardAlt: 'Story postcard',
      }),
    ])
  })
})
