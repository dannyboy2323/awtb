import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { type PortableTextBlock } from 'next-sanity'
import { Suspense } from 'react'

import Avatar from '@/app/components/Avatar'
import { MorePosts } from '@/app/components/Posts'
import PortableText from '@/app/components/PortableText'
import Image from '@/app/components/SanityImage'
import { sanityFetch } from '@/sanity/lib/live'
import { postPagesSlugs, postQuery } from '@/sanity/lib/queries'
import { resolveOpenGraphImage } from '@/sanity/lib/utils'

/**
 * Generate the static params for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: postPagesSlugs,
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
export async function generateMetadata(
  props: PageProps<'/posts/[slug]'>,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params
  const { data: post } = await sanityFetch({
    query: postQuery,
    params,
    // Metadata should never contain stega
    stega: false,
  })
  const previousImages = (await parent).openGraph?.images || []
  const ogImage = resolveOpenGraphImage(post?.coverImage)

  return {
    authors:
      post?.author?.firstName && post?.author?.lastName
        ? [{ name: `${post.author.firstName} ${post.author.lastName}` }]
        : [],
    title: post?.title,
    description: post?.excerpt,
    openGraph: {
      images: ogImage ? [ogImage, ...previousImages] : previousImages,
    },
  } satisfies Metadata
}

export default async function PostPage(props: PageProps<'/posts/[slug]'>) {
  const params = await props.params
  const [{ data: post }] = await Promise.all([sanityFetch({ query: postQuery, params })])

  if (!post?._id) {
    return notFound()
  }

  return (
    <>
      <div className="">
        <div className="container my-12 grid gap-12 lg:my-24">
          <div>
            <div className="mb-6 grid gap-6 border-b border-gray-100 pb-6">
              <div className="flex max-w-3xl flex-col gap-6">
                <h1 className="text-4xl text-gray-900 sm:text-5xl lg:text-7xl">{post.title}</h1>
              </div>
              <div className="flex max-w-3xl items-center gap-4">
                {post.author && post.author.firstName && post.author.lastName && (
                  <Avatar person={post.author} date={post.date} />
                )}
              </div>
            </div>
            <article className="grid max-w-4xl gap-6">
              <div className="">
                {post?.coverImage && (
                  <Image
                    id={post.coverImage.asset?._ref || ''}
                    alt={post.coverImage.alt || ''}
                    className="w-full rounded-sm"
                    width={1024}
                    height={538}
                    mode="cover"
                    hotspot={post.coverImage.hotspot}
                    crop={post.coverImage.crop}
                  />
                )}
              </div>
              {post.content?.length && (
                <PortableText
                  className="prose-headings:font-medium prose-headings:tracking-tight max-w-2xl"
                  value={post.content as PortableTextBlock[]}
                />
              )}
            </article>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="container grid gap-12 py-12 lg:py-24">
          <aside>
            <Suspense>
              <MorePosts skip={post._id} limit={2} />
            </Suspense>
          </aside>
        </div>
      </div>
    </>
  )
}
