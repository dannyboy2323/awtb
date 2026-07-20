import { describe, it, expect } from 'vitest'
import {
  dataAttr,
  linkResolver,
  resolveOpenGraphImage,
  urlForImage,
} from '@/sanity/lib/utils'

const image = {
  asset: { _ref: 'image-abc123-1200x627-jpg', _type: 'reference' },
  alt: 'A postcard',
} as Parameters<typeof urlForImage>[0]

describe('resolveOpenGraphImage', () => {
  it('returns undefined when no image is provided', () => {
    const result = resolveOpenGraphImage(null)
    expect(result).toBeUndefined()
  })

  it('returns undefined when image is undefined', () => {
    const result = resolveOpenGraphImage(undefined)
    expect(result).toBeUndefined()
  })

  it('builds a cropped descriptor for a Sanity image', () => {
    expect(resolveOpenGraphImage(image, 600, 314)).toEqual({
      url: expect.stringContaining('w=1200&h=627&fit=crop'),
      alt: 'A postcard',
      width: 600,
      height: 314,
    })
  })
})

describe('Sanity URL and editing helpers', () => {
  it('builds image URLs from configured Sanity assets', () => {
    expect(urlForImage(image).url()).toContain('cdn.sanity.io/images/')
  })

  it('resolves every supported link shape', () => {
    type Input = Parameters<typeof linkResolver>[0]

    expect(linkResolver(undefined)).toBeNull()
    expect(linkResolver({ href: 'https://example.com' } as Input)).toBe('https://example.com')
    expect(linkResolver({ linkType: 'href' } as Input)).toBeNull()
    expect(linkResolver({ linkType: 'page', page: 'about' } as Input)).toBe('/about')
    expect(linkResolver({ linkType: 'page', page: null } as Input)).toBeNull()
    expect(linkResolver({ linkType: 'unsupported' } as unknown as Input)).toBeNull()
  })

  it('creates a Visual Editing data attribute', () => {
    const attribute = dataAttr({ id: 'story-1', type: 'story', path: 'title' })
    expect(attribute).toBeDefined()
  })
})
