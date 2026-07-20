import { PortableTextBlock } from 'next-sanity'

import ResolvedLink from '@/app/components/ResolvedLink'
import PortableText from '@/app/components/PortableText'
import Image from '@/app/components/SanityImage'
import { stegaClean } from '@sanity/client/stega'
import { ExtractPageBuilderType } from '@/sanity/lib/types'

type CtaProps = {
  block: ExtractPageBuilderType<'callToAction'>
  index: number
  // Needed if you want to createDataAttributes to do non-text overlays in Presentation (Visual Editing)
  pageType: string
  pageId: string
}

/** Renders a Sanity call-to-action page-builder block. */
export default function CTA({ block }: CtaProps) {
  const { heading, eyebrow, body = [], button, image, theme, contentAlignment } = block

  const isDark = theme === 'dark'
  const isImageFirst = stegaClean(contentAlignment) === 'imageFirst'

  return (
    <section className={isDark ? 'dark relative dark:bg-black' : 'relative dark:bg-black'}>
      <div className="absolute inset-0 bg-[url(/images/tile-1-black.png)] bg-size-[5px] opacity-25 dark:bg-[url(/images/tile-1-white.png)]" />
      <div className="relative container">
        <div className="grid gap-12 py-12 lg:grid-cols-2">
          <div
            className={`${isImageFirst && image ? 'row-start-2 lg:col-start-2 lg:row-start-1' : ''} flex flex-col gap-2`}
          >
            {eyebrow && (
              <span className="font-mono text-sm tracking-tight uppercase opacity-70 dark:text-white">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl dark:text-white">{heading}</h2>
            )}
            {body && (
              <div className="lg:text-left">
                <PortableText value={body as PortableTextBlock[]} className="dark:prose-invert" />
              </div>
            )}

            {button?.buttonText && button?.link && (
              <div className="mt-4 flex">
                <ResolvedLink
                  link={button?.link}
                  className="hover:bg-blue focus:bg-blue flex items-center gap-2 rounded-full bg-black px-6 py-3 font-mono text-sm whitespace-nowrap text-white transition-colors duration-200 dark:bg-white dark:text-black dark:hover:text-white"
                >
                  {button?.buttonText}
                </ResolvedLink>
              </div>
            )}
          </div>

          {image?.asset?._ref && (
            <Image
              id={image.asset._ref}
              alt="Demo image"
              width={704}
              crop={image.crop}
              mode="cover"
              className="rounded-sm"
            />
          )}
        </div>
      </div>
    </section>
  )
}
