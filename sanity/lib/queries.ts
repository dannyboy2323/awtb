import { defineQuery } from 'next-sanity'

export const settingsQuery = defineQuery(`*[_type == "settings"][0]`)

/**
 * Link reference projection.
 *
 * Dereferences a `link` object's page reference to a slug string. The Sanity
 * starter also supported linking to `post` documents; that document type has
 * been removed, so only page links are dereferenced now.
 */
const linkReference = /* groq */ `
  _type == "link" => {
    "page": page->slug.current
  }
`

const linkFields = /* groq */ `
  link {
      ...,
      ${linkReference}
      }
`

export const getPageQuery = defineQuery(`
  *[_type == 'page' && slug.current == $slug][0]{
    _id,
    _type,
    name,
    slug,
    heading,
    subheading,
    "pageBuilder": pageBuilder[]{
      ...,
      _type == "callToAction" => {
        ...,
        button {
          ...,
          ${linkFields}
        }
      },
      _type == "infoSection" => {
        content[]{
          ...,
          markDefs[]{
            ...,
            ${linkReference}
          }
        }
      },
    },
  }
`)

/**
 * Sitemap source — all published `page` documents. The starter query also
 * unioned `post`; that document type has been removed.
 */
export const sitemapData = defineQuery(`
  *[_type == "page" && defined(slug.current)] | order(_type asc) {
    "slug": slug.current,
    _type,
    _updatedAt,
  }
`)

export const pagesSlugs = defineQuery(`
  *[_type == "page" && defined(slug.current)]
  {"slug": slug.current}
`)

/**
 * Postcard Stories queries
 */

/** All published stories ordered by orderRank, for the postcard grid */
export const allStoriesQuery = defineQuery(`
  *[_type == "story" && defined(publishedAt)] | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    postcard
  }
`)

/** Featured story for the above-the-fold hero */
export const featuredStoryQuery = defineQuery(`
  *[_type == "story" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    postcard
  }
`)

/** Story cover page data */
export const storyCoverQuery = defineQuery(`
  *[_type == "story" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    coverImage,
    "pageCount": count(pages)
  }
`)

/** Single story page — panels and prose */
export const storyPageQuery = defineQuery(`
  *[_type == "story" && slug.current == $slug][0] {
    title,
    "page": pages[$pageIndex] {
      panels[] {
        image,
        alt,
        caption
      },
      prose
    },
    "pageCount": count(pages)
  }
`)

/** Site settings singleton */
export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0] {
    featuredStory-> {
      _id, title, "slug": slug.current, postcard
    },
    deskBackgroundImage
  }
`)

/** All story slugs — used in generateStaticParams */
export const allStorySlugsQuery = defineQuery(`
  *[_type == "story" && defined(slug.current)] {
    "slug": slug.current,
    "pageCount": count(pages)
  }
`)

/**
 * Story reader query — fetches a full story with all pages and panels.
 *
 * Fetches a complete story by slug, including its cover images and the full
 * `body` Portable Text array. Panel images embedded in the body are fetched
 * with asset URL + dimension metadata so urlForImage() can build optimized
 * WebP URLs at render time.
 */
export const storyBySlugQuery = defineQuery(`
  *[_type == "story" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    "coverImage": coverImage {
      alt,
      "asset": asset-> {
        _id,
        url,
        metadata { dimensions { width, height } }
      }
    },
    "coverImagePortrait": coverImagePortrait {
      alt,
      "asset": asset-> {
        _id,
        url,
        metadata { dimensions { width, height } }
      }
    },
    "body": body[] {
      ...,
      _type == "panelImage" => {
        ...,
        "image": image {
          "asset": asset-> {
            _id,
            url,
            metadata { dimensions { width, height } }
          }
        }
      }
    }
  }
`)

export type StoryBySlugQueryResult = {
  _id: string
  title: string | null
  slug: { current: string } | null
  publishedAt: string | null
  coverImage: {
    alt: string | null
    asset: {
      _id: string
      url: string
      metadata: { dimensions: { width: number; height: number } } | null
    } | null
  } | null
  body: unknown[] | null
} | null
