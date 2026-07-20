import Link from 'next/link'

import { linkResolver } from '@/sanity/lib/utils'
import { DereferencedLink } from '@/sanity/lib/types'
import { analyticsEvents } from '@/lib/analytics'

interface ResolvedLinkProps {
  link: DereferencedLink
  children: React.ReactNode
  className?: string
}

/** Resolves a Sanity link definition into an internal or external Next.js link. */
export default function ResolvedLink({ link, children, className }: ResolvedLinkProps) {
  // resolveLink() is used to determine the type of link and return the appropriate URL.
  const resolvedLink = linkResolver(link)

  if (typeof resolvedLink === 'string') {
    return (
      <Link
        href={resolvedLink}
        target={link?.openInNewTab ? '_blank' : undefined}
        rel={link?.openInNewTab ? 'noopener noreferrer' : undefined}
        className={className}
        data-analytics-event={analyticsEvents.portableLinkOpened}
      >
        {children}
      </Link>
    )
  }
  return <>{children}</>
}
