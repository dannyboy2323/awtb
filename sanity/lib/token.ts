import 'server-only'

/** Server-only Sanity read token required for private and draft content. */
export const token = process.env.SANITY_API_READ_TOKEN

if (!token && process.env.CI !== 'true') {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}
