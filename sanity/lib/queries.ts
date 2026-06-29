import { defineQuery } from 'next-sanity'

export const settingsQuery = defineQuery(`*[_type == "settings"][0]`)

const postFields = /* groq */ `
  _id,
  "status": select(_originalId in path("drafts.**") => "draft", "published"),
  "title": coalesce(title, "Untitled"),
  "slug": slug.current,
  excerpt,
  coverImage,
  "date": coalesce(date, _updatedAt),
  "author": author->{firstName, lastName, picture},
`

const linkReference = /* groq */ `
  _type == "link" => {
    "page": page->slug.current,
    "post": post->slug.current
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

export const sitemapData = defineQuery(`
  *[_type == "page" || _type == "post" && defined(slug.current)] | order(_type asc) {
    "slug": slug.current,
    _type,
    _updatedAt,
  }
`)

export const allPostsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(date desc, _updatedAt desc) {
    ${postFields}
  }
`)

export const morePostsQuery = defineQuery(`
  *[_type == "post" && _id != $skip && defined(slug.current)] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
  }
`)

export const postQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug] [0] {
    content[]{
    ...,
    markDefs[]{
      ...,
      ${linkReference}
    }
  },
    ${postFields}
  }
`)

export const postPagesSlugs = defineQuery(`
  *[_type == "post" && defined(slug.current)]
  {"slug": slug.current}
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
 * Fetches a complete story by slug, including all ordered pages,
 * each page's 6 panels (with image asset URLs), and rich-text prose.
 *
 * Panels are fetched with asset metadata so we can use urlForImage()
 * to build optimized WebP URLs at render time.
 */
/**
 * ADD THIS TO sanity/lib/queries.ts
 * Replace the existing storyBySlugQuery and StoryBySlugQueryResult.
 *
 * Changes from previous version:
 *   - Removed panels[] dereference (panels now live inline in prose)
 *   - Added coverImage with asset URL + metadata
 *   - Simplified pages fetch (just prose, which contains inline panelImage blocks)
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
    "pages": pages[] {
      _key,
      prose[] {
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
  pages: Array<{
    _key: string
    prose: unknown
  }> | null
} | null
