/**
 * Development-only layout guard.
 * Any route under /dev/* returns a hard 404 in production.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0A0E11] text-white">
      <nav className="sticky top-0 z-50 flex items-center gap-6 border-b border-white/10 bg-black/80 px-6 py-3 backdrop-blur">
        <span className="font-mono text-xs tracking-widest text-yellow-400 uppercase">
          ⚠ Dev Only
        </span>
        <Link
          href="/dev/components"
          className="text-sm text-white/70 transition-colors hover:text-white"
        >
          Components
        </Link>
        <Link href="/" className="ml-auto text-sm text-white/70 transition-colors hover:text-white">
          ← Back to site
        </Link>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  )
}
