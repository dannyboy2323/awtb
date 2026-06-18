# Architecture

## Stack

| Layer                 | Technology                          |
| --------------------- | ----------------------------------- |
| Framework             | Next.js 16 (App Router, Turbopack)  |
| CMS                   | Sanity (embedded Studio at /studio) |
| Auth                  | Clerk                               |
| Hosting               | Vercel                              |
| Edge Cache            | Vercel Edge Config                  |
| Object Storage        | Vercel Blob                         |
| Cache / Rate Limiting | Upstash Redis                       |
| Analytics             | PostHog + Vercel Web Analytics      |
| Error Monitoring      | Sentry                              |
| Synthetic Monitoring  | Checkly                             |
| UI Components         | shadcn/ui (Radix UI + Tailwind)     |

## Data Flow

User request goes to the Vercel Edge Network (cached), which forwards to
Next.js App Router Server Components. Those fetch from the Sanity Live
Content API via `sanityFetch`, and read the featured story pointer from
Vercel Edge Config via `getFeaturedStorySlug`. Sanity assets are served
from the Sanity CDN.

## Cache Invalidation

Content changes in Sanity Studio trigger a webhook to `/api/revalidate`
which calls `revalidatePath()` to purge the ISR cache. Content updates
are live within seconds of publishing — no redeploy required.

## Key Directories

- `app/` — Next.js App Router pages and API routes
- `components/public/` — Public-facing UI components (DeskHero, PostcardGrid)
- `components/shared/` — Shared utilities (PostHogProvider)
- `components/ui/` — shadcn/ui components
- `lib/` — Server-side utilities (env, redis, posthog, flags)
- `sanity/lib/` — Sanity client, queries, utils, webhook validator
- `sanity/src/` — Sanity schema and Studio configuration
- `tests/unit/` — Vitest unit and component tests
- `tests/e2e/` — Playwright E2E tests
- `__checks__/` — Checkly production monitoring checks
