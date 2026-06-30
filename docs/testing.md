The diff only modifies `StoryReader.tsx` — it changes how the cover image is rendered (explicit width/height instead of the `fill` prop) and adds explanatory comments. This is an implementation detail of a UI component and has no bearing on any testing documentation. The testing guide is already accurate.

# Testing Guide

## Overview

This project has three layers of testing:

| Layer                 | Tool                     | Location      | When it runs               |
| --------------------- | ------------------------ | ------------- | -------------------------- |
| Unit + Component      | Vitest + Testing Library | `tests/unit/` | Pre-push hook, CI          |
| End-to-End            | Playwright               | `tests/e2e/`  | Manually, CI on PRs        |
| Production Monitoring | Checkly                  | `__checks__/` | Every 10 min in production |

---

## Unit Tests (Vitest)

Unit tests cover utility functions, API route logic, React components, and database schema.

```bash
npm test                  # run once
npm run test:watch        # watch mode during development
npm run test:coverage     # with coverage report
npm run test:ui           # interactive Vitest UI
```

### What's tested

| File                               | What it tests                                               |
| ---------------------------------- | ----------------------------------------------------------- |
| `tests/unit/imageUrl.test.ts`      | `urlForImage` and `resolveOpenGraphImage` from Sanity utils |
| `tests/unit/webhook.test.ts`       | Environment variable validation                             |
| `tests/unit/revalidate.test.ts`    | HMAC webhook validation error handling                      |
| `tests/unit/DeskHero.test.tsx`     | DeskHero component rendering and link behaviour             |
| `tests/unit/PostcardGrid.test.tsx` | PostcardGrid rendering with various story counts            |
| `tests/unit/db.test.ts`            | Drizzle ORM schema type inference                           |

### Writing new unit tests

Place test files in `tests/unit/` using the naming convention:

- `ComponentName.test.tsx` for React components
- `utilityName.test.ts` for utilities and API logic

Every new exported function should have at least one test. Use the existing tests as
patterns — import from `@/` aliases, use `describe`/`it`/`expect`, and mock
external dependencies rather than making real network calls.

---

## End-to-End Tests (Playwright)

E2E tests run a real browser against the local dev server and verify full user flows.

```bash
npm run test:e2e          # headless (CI mode)
npm run test:e2e:ui       # interactive Playwright UI
```

The dev server starts automatically when you run `npm run test:e2e` — no need to
start it separately.

### What's tested

| File                        | What it tests                                              |
| --------------------------- | ---------------------------------------------------------- |
| `tests/e2e/landing.spec.ts` | Landing page loads, desk hero renders, postcard link works |
| `tests/e2e/studio.spec.ts`  | Studio loads at `/studio` without errors                   |

### Writing new E2E tests

Place spec files in `tests/e2e/` using the `.spec.ts` extension. Use
`page.waitForLoadState('domcontentloaded')` rather than `networkidle` — the app has
persistent WebSocket connections (Sanity Live, PostHog, Clerk) that prevent true
network idle.

```typescript
import { test, expect } from "@playwright/test";

test("my new flow", async ({ page }) => {
  await page.goto("/your-route");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator(".your-selector")).toBeVisible();
});
```

---

## Production Monitoring (Checkly)

Checkly runs browser checks against `https://awtb.vercel.app` every 10 minutes from
`us-east-1` and `eu-central-1`. Failed checks trigger alerts.

```bash
# Test checks against production (requires CHECKLY_API_KEY + CHECKLY_ACCOUNT_ID)
export CHECKLY_API_KEY=$(grep CHECKLY_API_KEY .env.local | cut -d'=' -f2 | tr -d '"')
export CHECKLY_ACCOUNT_ID=$(grep CHECKLY_ACCOUNT_ID .env.local | cut -d'=' -f2 | tr -d '"')
npx checkly test

# Deploy updated checks to Checkly cloud
npx checkly deploy
```

### What's monitored

| File                          | What it checks                                                 |
| ----------------------------- | -------------------------------------------------------------- |
| `__checks__/homepage.spec.ts` | Landing page loads, desk hero is visible, postcard link exists |

### Adding new checks

Add `.spec.ts` files to `__checks__/`. They use the same Playwright syntax as E2E tests
but run against production (`baseURL: 'https://awtb.vercel.app'` set in `checkly.config.ts`).
Run `npx checkly deploy` after adding or updating checks.

---

## CI Pipeline

The GitHub Actions `test` job (`.github/workflows/ci.yml`) runs on every push to `main` or
`staging`, and on every PR targeting either branch:

1. TypeScript check (`npm run type-check`)
2. ESLint (`npm run lint`)
3. Unit tests (`npm test`)
4. Security audit (`npm audit --audit-level=critical`)
5. Notify Vercel of check status (always runs, even on failure)

Dependencies are installed with `npm install` after pinning npm to version 11.

E2E tests are not run in CI by default (they require a running server and take longer).
Run them locally before merging significant UI changes.

A separate `AI Docs Maintenance` workflow (`.github/workflows/ai-docs.yml`) runs on every
push to `main` (excluding doc-only changes). It uses Claude to review code diffs against
the docs in `docs/` and opens a PR if any documentation appears to be out of date.

---

## Pre-Push Hook

The Husky pre-push hook (`.husky/pre-push`) runs automatically before every `git push`:

```bash
npm run type-check
npm run lint
npm test
```

If any check fails, the push is blocked. Fix the issue and push again.
You cannot bypass this hook with `--no-verify` on protected branches.