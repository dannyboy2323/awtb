import { Link } from '@/sanity.types'
import { dataset, projectId, studioUrl } from '@/sanity/lib/api'
import { createDataAttribute, CreateDataAttributeProps } from 'next-sanity'
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { DereferencedLink } from '@/sanity/lib/types'

const builder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

/** Creates a configured Sanity image URL builder for an image source. */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}

/** Produces a cropped Open Graph image descriptor when an image is available. */
export function resolveOpenGraphImage(
  image?: SanityImageSource | null,
  width = 1200,
  height = 627
) {
  if (!image) return
  const url = urlForImage(image)?.width(1200).height(627).fit('crop').url()
  if (!url) return
  return { url, alt: (image as { alt?: string })?.alt || '', width, height }
}

/**
 * Resolve a `link` object to a URL path.
 *
 * Handles the URL and page link types. (The Sanity starter also supported a
 * `post` link type pointing at `/posts/:slug`; the post document type has been
 * removed, so that case no longer exists.)
 */
export function linkResolver(link: Link | DereferencedLink | undefined) {
  if (!link) return null

  // If linkType is not set but href is, lets set linkType to "href".  This comes into play when pasting links into the portable text editor because a link type is not assumed.
  if (!link.linkType && link.href) {
    link.linkType = 'href'
  }

  switch (link.linkType) {
    case 'href':
      return link.href || null
    case 'page':
      if (link?.page && typeof link.page === 'string') {
        return `/${link.page}`
      }
      return null
    default:
      return null
  }
}

type DataAttributeConfig = CreateDataAttributeProps &
  Required<Pick<CreateDataAttributeProps, 'id' | 'type' | 'path'>>

/** Builds Visual Editing data attributes for a Sanity document path. */
export function dataAttr(config: DataAttributeConfig) {
  return createDataAttribute({
    projectId,
    dataset,
    baseUrl: studioUrl,
  }).combine(config)
}
