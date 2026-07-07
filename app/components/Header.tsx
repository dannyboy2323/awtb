/**
 * Header
 *
 * Fixed site header shown across the (public) surface. Renders the site title
 * (from the Sanity `siteSettings` document, falling back to the brand name) and
 * primary navigation.
 *
 * The title fallback is the real brand — the Sanity starter default title and
 * the starter external template CTA have been removed.
 */

import Link from 'next/link'
import { settingsQuery } from '@/sanity/lib/queries'
import { sanityFetch } from '@/sanity/lib/live'

export default async function Header() {
  const { data: settings } = await sanityFetch({
    query: settingsQuery,
  })

  return (
    <header className="fixed inset-0 z-50 flex h-24 items-center bg-white/80 backdrop-blur-lg">
      <div className="container px-2 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-5">
          <Link className="flex items-center gap-2" href="/">
            <span className="pl-2 text-lg font-semibold sm:text-2xl">
              {settings?.title || 'Adventures with the Bull'}
            </span>
          </Link>

          <nav>
            <ul className="flex items-center gap-4 font-mono text-xs leading-5 tracking-tight sm:text-base md:gap-6">
              <li>
                <Link href="/about" className="hover:underline">
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
