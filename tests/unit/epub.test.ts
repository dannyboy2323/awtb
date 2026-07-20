import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStoryEpub, type EpubStory } from '@/lib/epub'

const completeStory: EpubStory = {
  id: 'story<&>',
  slug: 'story-one',
  title: 'Story <One>',
  publishedAt: '2026-07-20T00:00:00.000Z',
  coverImage: {
    url: 'https://cdn.sanity.io/images/project/dataset/cover.jpg',
    alt: 'Cover & hero',
  },
  body: [
    {
      _type: 'block',
      style: 'normal',
      children: [{ text: 'Line one\nLine <two> & more' }],
    },
    { _type: 'block', style: 'h2', children: [{ text: 'Chapter "One"' }] },
    { _type: 'block', style: 'h3', children: [{ text: 'A section' }] },
    { _type: 'block', style: 'blockquote', children: [{ text: 'A quote' }] },
    { _type: 'block', style: 'normal', children: [{}, { text: '' }] },
    { _type: 'block', style: 'normal' },
    {
      _type: 'panelImage',
      alt: 'Panel one',
      caption: 'A caption',
      image: { asset: { url: 'https://cdn.sanity.io/images/project/dataset/panel.png' } },
    },
    {
      _type: 'panelImage',
      image: { asset: { url: 'https://cdn.sanity.io/images/project/dataset/panel.png' } },
    },
    { _type: 'panelImage', image: { asset: {} } },
    { _type: 'unknown' },
  ],
}

describe('createStoryEpub', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates an EPUB 3 archive with escaped text, navigation, and deduplicated images', async () => {
    const fetchImage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    const bytes = await createStoryEpub(completeStory, { fetchImage })
    const zip = await JSZip.loadAsync(bytes)

    expect(await zip.file('mimetype')?.async('string')).toBe('application/epub+zip')
    expect(zip.file('META-INF/container.xml')).not.toBeNull()
    expect(zip.file('OEBPS/images/cover.jpg')).not.toBeNull()
    expect(zip.file('OEBPS/images/panel-2.jpg')).not.toBeNull()
    expect(fetchImage).toHaveBeenCalledTimes(2)

    const story = await zip.file('OEBPS/story.xhtml')?.async('string')
    expect(story).toContain('<h1>Story &lt;One&gt;</h1>')
    expect(story).toContain('Line one<br/>Line &lt;two&gt; &amp; more')
    expect(story).toContain('<h2>Chapter &quot;One&quot;</h2>')
    expect(story).toContain('<h3>A section</h3>')
    expect(story).toContain('<blockquote>A quote</blockquote>')
    expect(story).toContain('<figcaption>A caption</figcaption>')

    const manifest = await zip.file('OEBPS/content.opf')?.async('string')
    expect(manifest).toContain('<dc:identifier id="book-id">story&lt;&amp;&gt;</dc:identifier>')
    expect(manifest).toContain('properties="cover-image"')
    expect(manifest).toContain('<dc:date>2026-07-20T00:00:00.000Z</dc:date>')
    expect(await zip.file('OEBPS/nav.xhtml')?.async('string')).toContain('Story &lt;One&gt;')
  })

  it('creates a text-only EPUB without optional cover or publication metadata', async () => {
    const bytes = await createStoryEpub({
      id: 'plain-story',
      slug: 'plain-story',
      title: 'Plain Story',
      coverImage: null,
      body: [{ _type: 'block', children: [{ text: 'Plain text' }] }],
    })
    const zip = await JSZip.loadAsync(bytes)
    const manifest = await zip.file('OEBPS/content.opf')?.async('string')

    expect(manifest).not.toContain('cover-image')
    expect(manifest).not.toContain('<dc:date>')
    expect(zip.folder('OEBPS/images')?.filter(() => true)).toHaveLength(0)
  })

  it('downloads and converts Sanity images with the default image fetcher', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(Uint8Array.from([4, 5, 6]).buffer),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createStoryEpub({
      id: 'image-story',
      slug: 'image-story',
      title: 'Image Story',
      coverImage: {
        url: 'https://cdn.sanity.io/cover.webp',
        alt: null,
      },
      body: [
        {
          _type: 'panelImage',
          image: { asset: { url: 'https://cdn.sanity.io/panel.webp?rect=1' } },
        },
      ],
    })

    const requestedUrl = new URL(fetchMock.mock.calls[0][0])
    expect(requestedUrl.searchParams.get('fm')).toBe('jpg')
    expect(requestedUrl.searchParams.get('w')).toBe('1400')
  })

  it('rejects the EPUB when an image cannot be downloaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))

    await expect(
      createStoryEpub({
        id: 'broken-image',
        slug: 'broken-image',
        title: 'Broken Image',
        body: [
          {
            _type: 'panelImage',
            image: { asset: { url: 'https://cdn.sanity.io/broken.jpg' } },
          },
        ],
      })
    ).rejects.toThrow('Unable to download EPUB image (503)')
  })
})
