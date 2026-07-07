/**
 * Footer
 *
 * Site footer for the (public) surface. The Sanity starter previously rendered
 * a starter attribution line alongside links to the template repository and
 * framework docs; those have been replaced with the real brand line and a link
 * to the About page.
 */

import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative bg-gray-50">
      <div className="absolute inset-0 bg-[url(/images/tile-grid-black.png)] bg-size-[17px] bg-position-[0_1] opacity-20" />
      <div className="relative container">
        <div className="flex flex-col items-center py-28 lg:flex-row">
          <h3 className="mb-10 text-center font-mono text-4xl leading-tight tracking-tighter lg:mb-0 lg:w-1/2 lg:pr-4 lg:text-left lg:text-2xl">
            Adventures with the Bull
          </h3>
          <div className="flex flex-col items-center justify-center gap-3 lg:w-1/2 lg:flex-row lg:pl-4">
            <Link
              href="/about"
              className="hover:bg-blue focus:bg-blue flex items-center gap-2 rounded-full bg-black px-6 py-3 font-mono whitespace-nowrap text-white transition-colors duration-200"
            >
              About
            </Link>
            <span className="mx-3 font-mono text-sm text-gray-600">
              © {year} Adventures with the Bull
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
