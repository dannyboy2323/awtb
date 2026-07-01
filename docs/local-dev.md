The diff only changes ESLint ignore patterns (adding `dist/**` and `sanity/**` to the ignore list). This is an internal ESLint configuration detail that has no bearing on the local development guide's content — the guide covers prerequisites, setup, URLs, commands, and environment variables, none of which are affected by this change.

# Local Development Guide

## Prerequisites

- Node.js 22.x — `node -v`
- npm 11.x — `npm -v`
- Git with SSH configured
- Access to the Vercel and Sanity organizations

## Setup

```bash
git clone git@github.com:dannyboy2323/awtb.git
cd awtb
npm install
vercel link
vercel env pull .env.local
# Add sensitive vars manually — see .env.example
npm run dev
```

## Available URLs

- App: http://localhost:3000
- Studio: http://localhost:3000/studio
- Component gallery: http://localhost:3000/dev/components (dev only)
- Email preview: http://localhost:3001 (run `npm run email:dev`)
- Drizzle Studio: opens in browser (run `npm run db:studio`)

## Key Commands

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Start dev server (runs typegen first)     |
| `npm run typegen`       | Regenerate Sanity TypeScript types        |
| `npm run type-check`    | TypeScript check                          |
| `npm run lint`          | ESLint                                    |
| `npm run format`        | Prettier (also sorts package.json)        |
| `npm test`              | Unit tests                                |
| `npm run test:watch`    | Unit tests in watch mode                  |
| `npm run test:coverage` | Unit tests with coverage report           |
| `npm run test:e2e`      | Playwright E2E tests                      |
| `npm run test:all`      | Full suite: unit + E2E                    |
| `npm run analyze`       | Bundle size treemap                       |
| `npm run db:push`       | Push schema changes to Neon database      |
| `npm run db:studio`     | Open Drizzle Studio (visual DB browser)   |
| `npm run db:generate`   | Generate SQL migration file               |
| `npm run db:migrate`    | Apply pending migrations                  |
| `npm run email:dev`     | Preview email templates at localhost:3001 |
| `npm run docs`          | Generate TypeDoc API docs                 |

## Environment Variables

See `.env.example` for the full list. Run `vercel env pull .env.local` to
get non-sensitive vars. Add sensitive vars (tokens, secrets) manually from
the Vercel dashboard.

→ [Full environment variable reference](environment-setup.md)