import { get } from '@vercel/edge-config'

/**
 * Reads the featured story slug from Vercel Edge Config.
 * Returns in < 1ms from the edge — used on the landing page hero.
 */
export async function getFeaturedStorySlug(): Promise<string | null> {
  try {
    const slug = await get<string>('featuredStorySlug')
    return slug ?? null
  } catch {
    // Edge Config unavailable in local dev until EDGE_CONFIG is set
    return null
  }
}
