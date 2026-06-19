# Adventures With The Bull

> A graphic-novel storytelling platform. Readers enter each story through a postcard;
> inside, graphic-novel panels and prose are presented side by side, page by page.

[![CI](https://github.com/dannyboy2323/awtb/actions/workflows/ci.yml/badge.svg)](https://github.com/dannyboy2323/awtb/actions/workflows/ci.yml)
[![Docs](https://github.com/dannyboy2323/awtb/actions/workflows/docs.yml/badge.svg)](https://github.com/dannyboy2323/awtb/actions/workflows/docs.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Sanity](https://img.shields.io/badge/CMS-Sanity-F03E2F?logo=sanity&logoColor=white)](https://www.sanity.io/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://awtb.vercel.app)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live site:** [awtb.vercel.app](https://awtb.vercel.app) · **Studio:** [awtb.vercel.app/studio](https://awtb.vercel.app/studio)

---

## About

AWTB is a Next.js 16 application backed by an embedded Sanity Studio. Editors manage
postcards, cover images, graphic-novel panels, and prose entirely through the Studio at
`/studio`. Publishing triggers a webhook that revalidates the production cache within
seconds — no redeploy required.

→ **[Full architecture docs](docs/architecture.md)**

---

## Tech Stack

| Layer                 | Technology                                                                        | Purpose                                              |
| --------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Framework             | [Next.js 16](https://nextjs.org) (App Router, Turbopack)                          | Server Components, ISR, on-demand revalidation       |
| Language              | [TypeScript](https://www.typescriptlang.org/)                                     | End-to-end type safety + generated content types     |
| CMS                   | [Sanity](https://www.sanity.io/) (embedded at `/studio`)                          | Structured content, Visual Editing, Live Content API |
| Database              | [Neon](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team)               | Serverless Postgres with schema-as-code migrations   |
| Auth                  | [Clerk](https://clerk.com)                                                        | Authentication and user management                   |
| Hosting               | [Vercel](https://vercel.com)                                                      | Production hosting, preview deployments              |
| Edge Cache            | [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)                 | Sub-millisecond featured story pointer reads         |
| Object Storage        | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)                        | Static UI assets (desk background images)            |
| Cache / Rate Limiting | [Upstash Redis](https://upstash.com)                                              | Webhook rate limiting                                |
| UI Components         | [shadcn/ui](https://ui.shadcn.com)                                                | Accessible Radix UI + Tailwind components            |
| Styling               | [Tailwind CSS v4](https://tailwindcss.com)                                        | Utility-first styling                                |
| Analytics             | [PostHog](https://posthog.com) + [Vercel Analytics](https://vercel.com/analytics) | Product analytics, session replay, feature flags     |
| Error Monitoring      | [Sentry](https://sentry.io)                                                       | Runtime errors and performance tracing               |
| Synthetic Monitoring  | [Checkly](https://checklyhq.com)                                                  | Production uptime checks every 10 min                |
| Email                 | [Resend](https://resend.com) + [React Email](https://react.email)                 | Transactional email + mailing lists                  |
| CI/CD                 | [GitHub Actions](https://github.com/features/actions)                             | Typecheck, lint, test, security audit on every PR    |
| Formatting            | [Prettier](https://prettier.io)                                                   | Consistent code style                                |
| Linting               | [ESLint](https://eslint.org) + jsx-a11y                                           | Code quality and accessibility                       |
| API Docs              | [TypeDoc](https://typedoc.org)                                                    | Auto-generated docs → GitHub Wiki                    |

---

## Getting Started

### Prerequisites

- Node.js 22.x — `node -v`
- npm 10.x — `npm -v`
- Git with SSH configured
- Vercel CLI — `npm install -g vercel`

→ **[Full local dev guide](docs/local-dev.md)**

### Quick Start

```bash
git clone git@github.com:dannyboy2323/awtb.git
cd awtb
npm install
vercel link
vercel env pull .env.local
# Add sensitive vars manually — see .env.example
npm run dev
```

- App: http://localhost:3000
- Studio: http://localhost:3000/studio
- Component gallery: http://localhost:3000/dev/components _(dev only)_

→ **[Environment variable setup](docs/environment-setup.md)**

---

## Available Scripts

| Command              | What it does                                       |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Dev server (Turbopack). Runs `typegen` first.      |
| `npm run build`      | Production build.                                  |
| `npm run typegen`    | Regenerate `sanity.types.ts` after schema changes. |
| `npm run type-check` | TypeScript check.                                  |
| `npm run lint`       | ESLint.                                            |
| `npm run format`     | Prettier (sorts `package.json` too).               |
| `npm test`           | Vitest unit tests.                                 |
| `npm run test:e2e`   | Playwright E2E tests.                              |
| `npm run test:all`   | Unit + E2E — full pre-merge check.                 |
| `npm run analyze`    | Bundle size treemap.                               |
| `npm run db:push`    | Push schema changes to Neon database.              |
| `npm run db:studio`  | Open Drizzle Studio.                               |
| `npm run email:dev`  | Preview email templates at localhost:3001.         |
| `npm run docs`       | Generate TypeDoc API docs.                         |

---

## Project Structure

```
awtb/
├── .github/              # CI workflows, issue templates, PR template, CONTRIBUTING
├── __checks__/           # Checkly production monitoring checks
├── app/                  # Next.js App Router pages and API routes
├── components/
│   ├── public/           # Public-facing components (DeskHero, PostcardGrid)
│   ├── shared/           # Shared utilities (PostHogProvider)
│   └── ui/               # shadcn/ui components
├── db/                   # Drizzle ORM schema and client
├── docs/                 # Architecture, local dev, editor guide, deployment
├── emails/               # React Email templates
├── lib/                  # Server utilities (env, redis, email, posthog, flags, db)
├── sanity/               # Sanity client, queries, schema, Studio config
├── scripts/              # One-time scripts (upload-desk-images, init)
└── tests/                # Vitest unit tests and Playwright E2E tests
```

---

## Content Management

Editors manage all content through the embedded Studio at `/studio`.

→ **[Editor guide](docs/editor-guide.md)**

---

## Testing

```bash
npm test              # unit tests
npm run test:e2e      # E2E tests (Playwright)
npm run test:all      # full suite
```

Production is monitored by Checkly every 10 minutes from `us-east-1` and `eu-central-1`.

→ **[Testing guide](docs/testing.md)**

---

## Contributing

All changes go through feature branches and PRs. Direct pushes to `main` are blocked.
The pre-push hook runs typecheck, lint, and tests automatically.

→ **[Contributing guide](.github/CONTRIBUTING.md)**

---

## Deployment

- Push to `main` → auto-deploys to [awtb.vercel.app](https://awtb.vercel.app)
- Open a PR → Vercel creates a preview deployment URL

→ **[Deployment guide](docs/deployment.md)**

---

## Issue Tracking

Use [GitHub Issues](https://github.com/dannyboy2323/awtb/issues). Six issue templates
are available — select the appropriate one when filing. Reference issues in PRs with
`Closes #12` to auto-close on merge.

---

## License

[MIT](LICENSE)
