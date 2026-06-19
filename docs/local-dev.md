# Local Development Guide

## Prerequisites

- Node.js 22.x — `node -v`
- npm 10.x — `npm -v`
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

## Key Commands

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start dev server (runs typegen first) |
| `npm run typegen`    | Regenerate Sanity TypeScript types    |
| `npm run type-check` | TypeScript check                      |
| `npm run lint`       | ESLint                                |
| `npm test`           | Unit tests                            |
| `npm run test:e2e`   | Playwright E2E tests                  |
| `npm run analyze`    | Bundle size analysis                  |

## Environment Variables

See `.env.example` for the full list. Run `vercel env pull .env.local` to
get non-sensitive vars. Add sensitive vars (tokens, secrets) manually from
the Vercel dashboard.
