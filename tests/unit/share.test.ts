import { describe, expect, it } from 'vitest'

import { getShareDestinations } from '@/lib/share'

describe('getShareDestinations', () => {
  it('builds every required direct and universal share destination', () => {
    const destinations = getShareDestinations(
      'https://example.com/stories/the-bull?edition=1',
      'The Bull & Friends'
    )

    expect(destinations.map(({ id }) => id)).toEqual([
      'sms',
      'email',
      'print',
      'facebook',
      'x',
      'reddit',
      'linkedin',
      'whatsapp',
      'telegram',
      'pinterest',
      'threads',
      'instagram',
      'copy',
      'more',
    ])
    expect(destinations.find(({ id }) => id === 'sms')).toMatchObject({
      kind: 'link',
      href: expect.stringContaining('The%20Bull%20%26%20Friends'),
    })
    expect(destinations.find(({ id }) => id === 'email')).toMatchObject({
      kind: 'link',
      href: expect.stringContaining('subject=The+Bull+%26+Friends'),
    })
    expect(destinations.find(({ id }) => id === 'facebook')).toMatchObject({
      href: expect.stringContaining('add_to/facebook'),
    })
    expect(destinations.find(({ id }) => id === 'whatsapp')).toMatchObject({
      href: expect.stringContaining('wa.me'),
    })
    expect(destinations.find(({ id }) => id === 'instagram')).toMatchObject({
      kind: 'copy',
    })
    expect(destinations.at(-1)).toMatchObject({
      id: 'more',
      href: expect.stringContaining('addtoany.com/share'),
    })
  })
})
