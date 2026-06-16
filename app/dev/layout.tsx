/**
 * Development-only layout guard.
 * Any route under /dev/* returns a hard 404 in production.
 */
import { notFound } from "next/navigation";
import Link from "next/link";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0A0E11] text-white">
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center gap-6">
        <span className="text-xs font-mono text-yellow-400 uppercase tracking-widest">
          ⚠ Dev Only
        </span>
        <Link
          href="/dev/components"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Components
        </Link>
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white transition-colors ml-auto"
        >
          ← Back to site
        </Link>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  );
}
