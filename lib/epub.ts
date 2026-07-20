import JSZip from 'jszip'

/** Image metadata embedded in a downloadable story. */
export interface EpubImage {
  url: string
  alt?: string | null
  caption?: string | null
}

/** Portable Text block shape required by the EPUB renderer. */
export interface EpubBodyBlock {
  _type?: string
  style?: string
  children?: Array<{ text?: string }>
  alt?: string | null
  caption?: string | null
  image?: {
    asset?: {
      url?: string | null
    } | null
  } | null
}

/** Normalized story data required to build an offline EPUB file. */
export interface EpubStory {
  id: string
  slug: string
  title: string
  publishedAt?: string | null
  coverImage?: EpubImage | null
  body: EpubBodyBlock[]
}

/** Injectable network boundary used to make EPUB image downloads testable. */
export interface EpubDependencies {
  fetchImage?: (url: string) => Promise<Uint8Array>
}

interface EmbeddedImage {
  filename: string
  sourceUrl: string
  bytes: Uint8Array
  alt: string
  caption?: string | null
  isCover: boolean
}

const EPUB_MIME_TYPE = 'application/epub+zip'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function textFromBlock(block: EpubBodyBlock): string {
  return (block.children ?? [])
    .map((child) => child.text ?? '')
    .join('')
    .split('\n')
    .map(escapeXml)
    .join('<br/>')
}

function imageUrlFromBlock(block: EpubBodyBlock): string | null {
  return block.image?.asset?.url ?? null
}

function optimizedJpegUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl)
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'max')
  url.searchParams.set('fm', 'jpg')
  url.searchParams.set('q', '82')
  url.searchParams.set('w', '1400')
  return url.toString()
}

async function fetchImage(sourceUrl: string): Promise<Uint8Array> {
  const response = await fetch(optimizedJpegUrl(sourceUrl))
  if (!response.ok) {
    throw new Error(`Unable to download EPUB image (${response.status})`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

function collectImages(story: EpubStory): Array<Omit<EmbeddedImage, 'bytes'>> {
  const images: Array<Omit<EmbeddedImage, 'bytes'>> = []
  const seen = new Set<string>()

  if (story.coverImage?.url) {
    seen.add(story.coverImage.url)
    images.push({
      filename: 'cover.jpg',
      sourceUrl: story.coverImage.url,
      alt: story.coverImage.alt ?? `${story.title} cover`,
      caption: story.coverImage.caption,
      isCover: true,
    })
  }

  for (const block of story.body) {
    const sourceUrl = imageUrlFromBlock(block)
    if (!sourceUrl || seen.has(sourceUrl)) continue
    seen.add(sourceUrl)
    images.push({
      filename: `panel-${images.length + 1}.jpg`,
      sourceUrl,
      alt: block.alt ?? 'Story illustration',
      caption: block.caption,
      isCover: false,
    })
  }

  return images
}

function renderBody(story: EpubStory, images: EmbeddedImage[]): string {
  const imageByUrl = new Map(images.map((image) => [image.sourceUrl, image]))
  const parts: string[] = []

  const cover = images.find((image) => image.isCover)
  if (cover) {
    parts.push(
      `<figure class="cover"><img src="images/${cover.filename}" alt="${escapeXml(cover.alt)}"/></figure>`
    )
  }

  for (const block of story.body) {
    if (block._type === 'panelImage') {
      const sourceUrl = imageUrlFromBlock(block)
      const image = sourceUrl ? imageByUrl.get(sourceUrl) : undefined
      if (!image) continue
      const caption = image.caption ? `<figcaption>${escapeXml(image.caption)}</figcaption>` : ''
      parts.push(
        `<figure><img src="images/${image.filename}" alt="${escapeXml(image.alt)}"/>${caption}</figure>`
      )
      continue
    }

    if (block._type !== 'block') continue
    const text = textFromBlock(block)
    if (!text) continue

    if (block.style === 'h2') {
      parts.push(`<h2>${text}</h2>`)
    } else if (block.style === 'h3') {
      parts.push(`<h3>${text}</h3>`)
    } else if (block.style === 'blockquote') {
      parts.push(`<blockquote>${text}</blockquote>`)
    } else {
      parts.push(`<p>${text}</p>`)
    }
  }

  return parts.join('\n')
}

function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
}

function navigationXhtml(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>Contents</title></head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>Contents</h1>
      <ol><li><a href="story.xhtml">${escapeXml(title)}</a></li></ol>
    </nav>
  </body>
</html>`
}

function storyXhtml(story: EpubStory, images: EmbeddedImage[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${escapeXml(story.title)}</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
  </head>
  <body>
    <article>
      <h1>${escapeXml(story.title)}</h1>
      ${renderBody(story, images)}
    </article>
  </body>
</html>`
}

function stylesheet(): string {
  return `body { color: #171717; font-family: Georgia, serif; line-height: 1.6; margin: 5%; }
h1, h2, h3 { line-height: 1.2; }
figure { break-inside: avoid; margin: 1.5rem auto; text-align: center; }
figure.cover { break-after: page; }
img { height: auto; max-width: 100%; }
figcaption { color: #525252; font-size: 0.85em; margin-top: 0.5rem; }
blockquote { border-left: 0.25rem solid #737373; margin-left: 0; padding-left: 1rem; }`
}

function packageDocument(story: EpubStory, images: EmbeddedImage[]): string {
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const imageItems = images
    .map((image, index) => {
      const properties = image.isCover ? ' properties="cover-image"' : ''
      return `<item id="image-${index + 1}" href="images/${image.filename}" media-type="image/jpeg"${properties}/>`
    })
    .join('\n    ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${escapeXml(story.id)}</dc:identifier>
    <dc:title>${escapeXml(story.title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Adventures With The Bull</dc:creator>
    ${story.publishedAt ? `<dc:date>${escapeXml(story.publishedAt)}</dc:date>` : ''}
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="story" href="story.xhtml" media-type="application/xhtml+xml"/>
    <item id="styles" href="styles.css" media-type="text/css"/>
    ${imageItems}
  </manifest>
  <spine><itemref idref="story"/></spine>
</package>`
}

/**
 * Builds a standards-compliant EPUB 3 archive with offline story text and images.
 *
 * The EPUB mimetype is deliberately inserted first and stored without compression,
 * as required by the EPUB container specification. Remaining files are compressed.
 */
export async function createStoryEpub(
  story: EpubStory,
  dependencies: EpubDependencies = {}
): Promise<Uint8Array> {
  const downloadImage = dependencies.fetchImage ?? fetchImage
  const imageMetadata = collectImages(story)
  const images = await Promise.all(
    imageMetadata.map(async (image) => ({
      ...image,
      bytes: await downloadImage(image.sourceUrl),
    }))
  )

  const zip = new JSZip()
  zip.file('mimetype', EPUB_MIME_TYPE, { compression: 'STORE' })
  zip.file('META-INF/container.xml', containerXml())
  zip.file('OEBPS/nav.xhtml', navigationXhtml(story.title))
  zip.file('OEBPS/story.xhtml', storyXhtml(story, images))
  zip.file('OEBPS/styles.css', stylesheet())
  zip.file('OEBPS/content.opf', packageDocument(story, images))
  for (const image of images) {
    zip.file(`OEBPS/images/${image.filename}`, image.bytes)
  }

  return zip.generateAsync({
    type: 'uint8array',
    mimeType: EPUB_MIME_TYPE,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}
