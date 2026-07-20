Looking at the diff, I need to check what changed that affects the local-dev.md content:

1. The CI workflow now runs `npm run env:check:ci`, `npm run docs:check`, `npm run observability:check`, and `npm run test:e2e:coverage` as named steps — these are new scripts.
2. A Husky pre-commit hook (`npm run quality:gate`) is now confirmed in `.husky/pre-commit`.
3. The CI workflow uses `npm run test:coverage` (already in the table) and `npm run test:e2e:coverage` (not in the table).

The new CI steps suggest there are new scripts: `env:check:ci`, `docs:check`, `observability:check`, and `test:e2e:coverage`. The `test:e2e:coverage` script is a new distinct command from `test:e2e`. The others (`env:check:ci`, `docs:check`, `observability:check`) are CI-specific variants that may not be the dev-facing commands, so I won't add those unless they're clearly user-facing.

`npm run test:e2e:coverage` is new and user-facing enough to add alongside `test:e2e`.

The existing content about the Husky pre-commit hook is already accurate. No other content is incorrect.

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

| Command                      | Description                               |
| ---------------------------- | ----------------------------------------- |
| `npm run dev`                | Start dev server (runs typegen first)     |
| `npm run typegen`            | Regenerate Sanity TypeScript types        |
| `npm run type-check`         | TypeScript check                          |
| `npm run lint`               | ESLint                                    |
| `npm run format`             | Prettier (also sorts package.json)        |
| `npm test`                   | Unit tests                                |
| `npm run test:watch`         | Unit tests in watch mode                  |
| `npm run test:coverage`      | Unit tests with coverage report           |
| `npm run test:e2e`           | Playwright E2E tests                      |
| `npm run test:e2e:coverage`  | Playwright E2E tests with journey coverage validation |
| `npm run test:all`           | Full suite: unit + E2E                    |
| `npm run analyze`            | Bundle size treemap                       |
| `npm run db:push`            | Push schema changes to Neon database      |
| `npm run db:studio`          | Open Drizzle Studio (visual DB browser)   |
| `npm run db:generate`        | Generate SQL migration file               |
| `npm run db:migrate`         | Apply pending migrations                  |
| `npm run email:dev`          | Preview email templates at localhost:3001 |
| `npm run docs`               | Generate TypeDoc API docs                 |
| `npm run quality:gate`       | Run the complete pre-commit quality gate  |

The Husky pre-commit hook runs `npm run quality:gate`. It validates generated
types, lint, environment completeness, exported API documentation, semantic
analytics coverage, unit coverage, every declared E2E journey, the production
build, and a real `next start` HTTP smoke test.

## Environment Variables

See `.env.example` for the full list. Run `vercel env pull .env.local` to
get non-sensitive vars. Add sensitive vars (tokens, secrets) manually from
the Vercel dashboard.

→ [Full environment variable reference](environment-setup.md)