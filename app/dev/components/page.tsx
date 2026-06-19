/**
 * Component gallery — development only.
 *
 * Add a new <Section> for every component as you build it.
 * Use realistic sample data that mirrors what Sanity would return.
 * This page is a hard 404 in production (enforced by the dev layout).
 */
import DeskHero from '@/components/public/DeskHero'
import PostcardGrid from '@/components/public/PostcardGrid'

/* ─── Sample data ─────────────────────────────────────────────────────────── */

const SAMPLE_POSTCARD_URL =
  'https://cdn.sanity.io/images/d205mlci/production/dd540580ee9c5c3443139a41fbfc3404d4ff75bc-1008x1008.webp'

const SAMPLE_STORIES = [
  {
    _id: 'story-1',
    title: 'The Bronze Bull',
    slug: 'the-bronze-bull',
    publishedAt: '2026-01-15T00:00:00Z',
    postcard: {
      alt: 'A vintage postcard featuring a bronze bull statue',
      asset: null,
    },
  },
  {
    _id: 'story-2',
    title: 'Adventures With the Bull',
    slug: 'adventures-with-the-bull',
    publishedAt: '2026-02-20T00:00:00Z',
    postcard: {
      alt: 'A worn travel postcard with handwritten notes',
      asset: null,
    },
  },
  {
    _id: 'story-3',
    title: 'The Train Ticket',
    slug: 'the-train-ticket',
    publishedAt: '2026-03-10T00:00:00Z',
    postcard: {
      alt: 'A vintage train ticket from an unknown destination',
      asset: null,
    },
  },
]

/* ─── Layout helpers ──────────────────────────────────────────────────────── */

function Section({
  title,
  description,
  children,
  fullWidth = false,
}: {
  title: string
  description?: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <section className="mb-20">
      <div className="mb-6 border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
      </div>
      <div className={fullWidth ? '' : 'max-w-5xl'}>{children}</div>
    </section>
  )
}

function Variant({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="mb-3 font-mono text-xs tracking-widest text-white/40 uppercase">{label}</p>
      {children}
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ComponentGalleryPage() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white">Component Gallery</h1>
        <p className="mt-2 text-white/50">
          Visual preview of all public-facing components. Add new sections as you build. This page
          does not exist in production.
        </p>
      </div>

      {/* ── DeskHero ──────────────────────────────────────────────────────── */}
      <Section
        title="DeskHero"
        description="Above-the-fold hero with desk background and featured story postcard."
        fullWidth
      >
        <Variant label="With featured story postcard">
          <DeskHero
            postcardUrl={SAMPLE_POSTCARD_URL}
            postcardAlt="Sample featured story postcard"
            storySlug="test-story"
            storyTitle="Test Story"
          />
        </Variant>

        <Variant label="Fallback — no featured story">
          <div className="desk-hero flex items-center justify-center">
            <p className="text-lg text-white opacity-60">No featured story selected</p>
          </div>
        </Variant>
      </Section>

      {/* ── PostcardGrid ──────────────────────────────────────────────────── */}
      <Section
        title="PostcardGrid"
        description="Below-the-fold responsive grid of story postcards."
        fullWidth
      >
        <Variant label="3 stories">
          <PostcardGrid stories={SAMPLE_STORIES} />
        </Variant>

        <Variant label="Empty state">
          <PostcardGrid stories={[]} />
        </Variant>
      </Section>

      {/* ── Add new components below as you build them ────────────────────── */}
      {/*
        <Section title="PostcardCard" description="Individual postcard tile.">
          ...
        </Section>

        <Section title="StoryCover" description="Full-screen story cover page.">
          ...
        </Section>

        <Section title="StoryReader" description="Split-pane panels + prose layout.">
          ...
        </Section>

        <Section title="PanelStrip" description="Ordered graphic novel panel column.">
          ...
        </Section>

        <Section title="PageNav" description="Previous / next page navigation.">
          ...
        </Section>
      */}
    </div>
  )
}
