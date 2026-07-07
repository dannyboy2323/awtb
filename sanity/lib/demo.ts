/**
 * Fallback site metadata.
 *
 * These values are used by `app/layout.tsx` and `app/components/Header.tsx`
 * ONLY when the Sanity `siteSettings` document has no `title` / `description`
 * set. In normal operation the values from Sanity win; these constants exist so
 * the site still renders a correct, branded title before any settings document
 * is populated (and during local/dev bootstrapping).
 *
 * Historically this file shipped the Sanity starter default values; those
 * have been replaced with the real brand.
 */

/** Fallback site title shown in the browser tab and header when Sanity has none. */
export const title = 'Adventures with the Bull'

/**
 * Fallback site description as a Portable Text block array (matches the shape
 * of the Sanity `settings.description` field so `toPlainText` can consume it).
 */
export const description = [
  {
    _key: 'awtb-desc-0',
    _type: 'block',
    children: [
      {
        _key: 'awtb-desc-span-0',
        _type: 'span',
        marks: [],
        text: 'A graphic-novel storytelling platform. Readers enter each story through a postcard; inside, illustrated panels and prose unfold side by side, page by page.',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]

/** Fallback title used when composing the Open Graph share image. */
export const ogImageTitle = 'Adventures with the Bull'
