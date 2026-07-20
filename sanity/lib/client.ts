import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, studioUrl } from '@/sanity/lib/api'
import { token } from '@/sanity/lib/token'

/** Published-perspective Sanity client with Visual Editing metadata enabled. */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  token, // Required if you have a private dataset
  stega: { studioUrl },
})
