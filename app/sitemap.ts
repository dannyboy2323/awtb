import { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { sitemapData } from '@/sanity/lib/queries'
import { headers } from 'next/headers'

/**
 * Generates the application sitemap (sitemap.xml).
 *
 * Emits the site root plus every published `page` document. (The Sanity starter
 * also emitted `/posts/:slug` entries; the post document type has been removed.)
 *
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allPages = await sanityFetch({
    query: sitemapData,
  })
  const headersList = await headers()
  const sitemap: MetadataRoute.Sitemap = []
  const domain: string = headersList.get('host') as string
  sitemap.push({
    url: domain as string,
    lastModified: new Date(),
    priority: 1,
    changeFrequency: 'monthly',
  })

  if (allPages != null && allPages.data.length != 0) {
    for (const p of allPages.data) {
      // Only `page` documents are returned by sitemapData now.
      sitemap.push({
        lastModified: p._updatedAt || new Date(),
        priority: 0.8,
        changeFrequency: 'monthly',
        url: `${domain}/${p.slug}`,
      })
    }
  }

  return sitemap
}
