@AGENTS.md

---

# ALWAYS Read These Files First

Before writing a single line of code or making any changes, read these files in order:

1. `README.md` — project overview, tech stack, tooling, architecture summary
2. `docs/architecture.md` — full architecture, data flow, key directories
3. `docs/local-dev.md` — how the dev environment works
4. `docs/editor-guide.md` — content model and editorial workflow
5. `AGENTS.md` (this file) — all coding rules and conventions

These files are the source of truth for this project. Your training data is outdated.
The docs reflect the actual current state of the codebase.

---

# Claude-Specific Rules for awtb

---

## How to Work in This Repo

This is a production Next.js 16 + Sanity project. Before writing any code:

1. Read `AGENTS.md` (imported above) — all rules there apply
2. Check the current state of the file you're about to edit (`cat` it first)
3. Run `npx tsc --noEmit` before and after any change to catch type errors early
4. Run `npm run lint` to confirm no ESLint violations before committing

---

## Preferred Approach

- **Small pieces** — implement one thing at a time, verify it compiles and passes lint before moving on
- **Read before writing** — always `cat` a file before editing it; never assume its current contents
- **PR workflow** — every change goes through a feature branch and PR, never direct to `main`
- **Test as you go** — write or update tests alongside the code, not after

---

## Common Commands

```bash
# Start dev server (runs typegen first)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e

# Regenerate Sanity types after schema changes
npm run typegen

# Full pre-push check (same as the Husky hook)
npm run type-check && npm run lint && npm test
```

---

## Key File Locations

| What                   | Where                                   |
| ---------------------- | --------------------------------------- |
| Landing page           | `app/page.tsx`                          |
| Root layout            | `app/layout.tsx`                        |
| Clerk middleware       | `proxy.ts`                              |
| Env validation         | `lib/env.ts`                            |
| Sanity queries         | `sanity/lib/queries.ts`                 |
| Sanity client          | `sanity/lib/client.ts`                  |
| Image URL builder      | `sanity/lib/utils.ts` → `urlForImage()` |
| Redis client           | `lib/redis.ts`                          |
| PostHog server         | `lib/posthog.ts`                        |
| Feature flags          | `lib/flags.ts`                          |
| Edge Config            | `lib/edge-config.ts`                    |
| DeskHero component     | `components/public/DeskHero.tsx`        |
| PostcardGrid component | `components/public/PostcardGrid.tsx`    |
| shadcn components      | `components/ui/`                        |
| Unit tests             | `tests/unit/`                           |
| E2E tests              | `tests/e2e/`                            |
| Checkly checks         | `__checks__/`                           |

---

## When Helping with Sanity Schema

After any schema change, always remind the user to run:

```bash
npm run typegen
```

Then verify with:

```bash
npx tsc --noEmit
```

---

## When Adding New Integrations

1. Check if a Vercel-native integration exists first (preferred over manual setup)
2. Add env vars to `lib/env.ts` and `.env.example`
3. Use the PR workflow — never commit directly to `main`
4. Update the Tooling section in `README.md`

---

## Known Project-Specific Gotchas

- `middleware.ts` is renamed to `proxy.ts` — this is a Next.js 16 convention
- `BLOB_READ_WRITE_TOKEN` must not have quotes in `.env.local`
- `KV_REST_API_URL`/`KV_REST_API_TOKEN` are the Vercel KV integration var names (not the Upstash defaults)
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is the PostHog var name (not `NEXT_PUBLIC_POSTHOG_KEY`)
- `NEXT_PUBLIC_SENTRY_DSN` is the Sentry var name (not `SENTRY_DSN`)
- TypeGen scans from `sanity/` workspace root — paths in `sanity.cli.ts` are relative to that
- `background-attachment: fixed` is removed — desk hero scrolls naturally with the page
- `cacheComponents` is removed from `next.config.ts` — it conflicts with `next-sanity`'s `sanityFetch`
