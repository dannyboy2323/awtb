import type { Metadata } from 'next'

/** Search and browser metadata for the forthcoming About page. */
export const metadata: Metadata = {
  title: 'About | Adventures With The Bull',
  description: 'About Adventures With The Bull.',
}

/** Renders the About page placeholder until its editorial content is supplied. */
export default function AboutPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 pt-20">
      <h1 className="text-4xl font-medium tracking-tight">About</h1>
    </main>
  )
}
