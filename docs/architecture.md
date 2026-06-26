The diff adds a story reader feature with several new components, a new route, CSS, and scripts. I need to update the Key Directories section to reflect the new components and scripts, and add the new route to the Data Flow description. The rest of the architecture doc remains accurate.

# Architecture

## Stack

| Layer                 | Technology                               |
| --------------------- | ---------------------------------------- |
| Framework             | Next.js 16 (App Router, Turbopack)       |
| Language              | TypeScript (strict mode)                 |
| CMS                   | Sanity (embedded Studio at /studio)      |
| Database              | Neon (serverless Postgres) + Drizzle ORM |
| Auth                  | Clerk                                    |
| Hosting               | Vercel                                   |
| Edge Cache            | Vercel Edge Config                       |
| Object Storage        | Vercel Blob                              |
| Cache / Rate Limiting | Upstash Redis                            |
| UI Components         | shadcn/ui (Radix UI + Tailwind)          |
| Analytics             | PostHog + Vercel Web Analytics           |
| Error Monitoring      | Sentry                                   |
| Synthetic Monitoring  | Checkly                                  |
| Email                 | Resend + React Email                     |
| AI                    | Anthropic Claude                         |

## Data Flow

User request goes to the Vercel Edge Network (cached), which forwards to
Next.js App Router Server Components. Those fetch from the Sanity Live
Content API via `sanityFetch`, and read the featured story pointer from
Vercel Edge Config via `getFeaturedStorySlug`. Sanity assets are served
from the Sanity CDN. Database queries go through Drizzle ORM to Neon
serverless Postgres via the pooled connection in `db/index.ts`.

Story pages at `/stories/[slug]` fetch the full story (all pages and panels)
from Sanity via `storyBySlugQuery` and pass the data to the client-side
`StoryReader` component. Background images for the story reader are served
from Vercel Blob CDN.

## Cache Invalidation

Content changes in Sanity Studio trigger a webhook to `/api/revalidate`
which calls `revalidatePath()` to purge the ISR cache. Content updates
are live within seconds of publishing — no redeploy required.

## Database

Neon Postgres is connected via the Vercel integration. Drizzle ORM provides
type-safe queries generated from the schema in `db/schema.ts`.

- Use `DATABASE_URL` (pooled) for application queries
- Use `DATABASE_URL_UNPOOLED` for migrations and long-running transactions
- Run `npm run db:push` to apply schema changes in development
- Run `npm run db:generate` + `npm run db:migrate` for production migrations
- Neon creates a database branch for each PR preview deployment automatically

## Email

Outgoing email is handled by Resend via `lib/email.ts`. React Email templates
live in `emails/` and are previewed with `npm run email:dev` (opens at localhost:3001).

- Transactional email: use `sendEmail()` from `lib/email.ts`
- Mailing lists and broadcasts: use Resend Broadcasts via the Resend dashboard

## AI

Anthropic Claude is used for automated documentation maintenance via
`scripts/ai-docs-check.mjs`, which runs on every push to `main` through the
`ai-docs.yml` GitHub Actions workflow. Claude reviews the git diff and opens
a PR if any documentation needs updating.

## Key Directories

- `app/` — Next.js App Router pages and API routes
- `app/stories/[slug]/` — Story reader route; server component fetches story data from Sanity
- `app/story-reader.css` — Visual styles for the story reader (Mignola-inspired journal layout)
- `components/public/` — Public-facing UI components (DeskHero, PostcardGrid, StoryReader, StoryPage, PanelGrid, StoryNavBar)
- `components/shared/` — Shared utilities (PostHogProvider)
- `components/ui/` — shadcn/ui components
- `db/` — Drizzle ORM schema (`schema.ts`) and client (`index.ts`)
- `emails/` — React Email templates (WelcomeEmail, NotificationEmail)
- `lib/` — Server-side utilities (env, redis, email, posthog, flags, edge-config)
- `public/images/` — Static image assets (UI icons and tiles)
- `sanity/lib/` — Sanity client, queries, utils, webhook validator
- `sanity/src/` — Sanity schema and Studio configuration
- `scripts/` — Utility scripts (ai-docs-check, upload-desk-images, upload-story-bg, init)
- `tests/unit/` — Vitest unit and component tests
- `tests/e2e/` — Playwright E2E tests
- `__checks__/` — Checkly production monitoring checks