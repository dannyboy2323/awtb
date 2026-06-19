import { describe, it, expect } from 'vitest'
import { resolveOpenGraphImage } from '@/sanity/lib/utils'

describe('resolveOpenGraphImage', () => {
  it('returns undefined when no image is provided', () => {
    const result = resolveOpenGraphImage(null)
    expect(result).toBeUndefined()
  })

  it('returns undefined when image is undefined', () => {
    const result = resolveOpenGraphImage(undefined)
    expect(result).toBeUndefined()
  })
})
