import type { Metadata } from 'next'

import { Separator } from '@/components/ui/separator'

/** Search and browser metadata for the About page. */
export const metadata: Metadata = {
  title: 'About',
  description: 'A love letter from a father to his son.',
}

/** Renders Danny's account of how Adventures with the Bull began. */
export default function AboutPage() {
  return (
    <main className="dark bg-background text-foreground min-h-screen">
      <article className="mx-auto max-w-3xl px-6 py-24 sm:px-8 sm:py-32">
        <header className="space-y-6">
          <h1 className="text-4xl font-medium tracking-tight text-balance sm:text-6xl">
            Adventures with the Bull
          </h1>
          <p className="text-muted-foreground text-xl leading-8 sm:text-2xl">
            A love letter from a father to his son.
          </p>
        </header>

        <Separator className="my-12 sm:my-16" />

        <div className="space-y-14 sm:space-y-16">
          <section aria-labelledby="the-bull" className="space-y-5">
            <h2 id="the-bull" className="text-2xl font-medium tracking-tight sm:text-3xl">
              The Bull
            </h2>
            <div className="space-y-5 text-base leading-8 sm:text-lg">
              <p>
                I have called my son Daniel &quot;The Bull&quot; since the day he was born. Some
                nicknames you choose; this one chose him. He came into the world with a kind of
                unstoppable force to him, and the name stuck the way true things do.
              </p>
              <p>
                When Daniel was small, the weekends were ours. We called them our adventures — never
                anything elaborate, just the two of us going out to meet the world and see what it
                had for us. To a six-year-old, a parking lot can be a canyon and an afternoon can
                last a year. I didn&apos;t know then how much I was memorizing those days. You
                rarely do.
              </p>
            </div>
          </section>

          <Separator />

          <section aria-labelledby="when-i-went-away" className="space-y-5">
            <h2 id="when-i-went-away" className="text-2xl font-medium tracking-tight sm:text-3xl">
              When I Went Away
            </h2>
            <div className="space-y-5 text-base leading-8 sm:text-lg">
              <p>Then I went away.</p>
              <p>
                I spent five years in federal prison for white-collar crimes. Daniel was six years
                old when I left, and we were best friends. That is the plain fact of it, and there
                is no softer way to write it that would be honest. The hardest part of being gone
                was not where I was. It was where I wasn&apos;t — I wasn&apos;t there for the
                adventures, and the adventures were the thing.
              </p>
            </div>
          </section>

          <Separator />

          <section aria-labelledby="how-this-began" className="space-y-5">
            <h2 id="how-this-began" className="text-2xl font-medium tracking-tight sm:text-3xl">
              How This Began
            </h2>
            <div className="space-y-5 text-base leading-8 sm:text-lg">
              <p>So I made a way to keep going on them.</p>
              <p>
                From inside, I imagined a place where Daniel and I could keep adventuring — not in a
                car on a Saturday, but remotely, in a fantasy world I could build for the two of us.
                That idea became Adventures with the Bull. It was how I stayed his father across a
                distance that was designed to make that impossible.
              </p>
              <p>
                I wrote the stories by hand. Over roughly a thousand of them, in pen, in the
                composition journals I bought from the prison commissary — page after page, night
                after night. And I built the app itself on a contraband, rooted Android phone,
                teaching myself as I went, because the work was the one place they couldn&apos;t
                keep me from him.
              </p>
            </div>
          </section>

          <Separator />

          <section aria-labelledby="what-this-is" className="space-y-5">
            <h2 id="what-this-is" className="text-2xl font-medium tracking-tight sm:text-3xl">
              What This Is
            </h2>
            <div className="space-y-5 text-base leading-8 sm:text-lg">
              <p>
                Adventures with the Bull is, first and most simply, a graphic-novel reader. You
                enter each story through a postcard. Inside, illustrated panels and prose sit side
                by side, and you move through it page by page — the way you&apos;d move through a
                place you were seeing for the first time.
              </p>
              <p>
                But underneath the format, it is a love letter from a father to his son. Every story
                is an adventure I wanted to take Daniel on and couldn&apos;t — so I built the world
                instead and sent it to him the only way I had. If you are reading this before the
                first story, that is the context I would want you to carry in with you: that these
                were written toward someone, by someone who wasn&apos;t allowed to be there, and
                refused to be gone anyway.
              </p>
              <p className="text-xl leading-8 font-medium">
                Welcome to the adventures. The Bull goes first.
              </p>
            </div>
          </section>
        </div>
      </article>
    </main>
  )
}
