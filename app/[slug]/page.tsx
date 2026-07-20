import type { Metadata } from 'next'
import Head from 'next/head'
import { notFound } from 'next/navigation'

import PageBuilderPage from '@/app/components/PageBuilder'
import { sanityFetch } from '@/sanity/lib/live'
import { getPageQuery, pagesSlugs } from '@/sanity/lib/queries'
import { GetPageQueryResult } from '@/sanity.types'

/**
 * Dynamic CMS page route (e.g. /about).
 *
 * Renders a Sanity `page` document via the PageBuilder. Unknown slugs return a
 * 404. (The Sanity starter previously rendered a `PageOnboarding` prompt here;
 * that starter scaffolding has been removed.)
 */

/**
 * Generate the static params for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: pagesSlugs,
    // Use the published perspective in generateStaticParams
    perspective: 'published',
    stega: false,
  })
  return data
}

/**
 * Generate metadata for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#generatemetadata-function
 */
export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const params = await props.params
  const { data: page } = await sanityFetch({
    query: getPageQuery,
    params,
    // Metadata should never contain stega
    stega: false,
  })

  return {
    title: page?.name,
    description: page?.heading,
  } satisfies Metadata
}

/** Renders a Sanity-authored page resolved from its URL slug. */
export default async function Page(props: PageProps<'/[slug]'>) {
  const params = await props.params
  const [{ data: page }] = await Promise.all([sanityFetch({ query: getPageQuery, params })])

  if (!page?._id) {
    return notFound()
  }

  return (
    <div className="my-12 lg:my-24">
      <Head>
        <title>{page.heading}</title>
      </Head>
      <div className="">
        <div className="container">
          <div className="border-b border-gray-100 pb-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl text-gray-900 sm:text-5xl lg:text-7xl">{page.heading}</h1>
              <p className="mt-4 text-base leading-relaxed font-light text-gray-600 uppercase lg:text-lg">
                {page.subheading}
              </p>
            </div>
          </div>
        </div>
      </div>
      <PageBuilderPage page={page as GetPageQueryResult} />
    </div>
  )
}
