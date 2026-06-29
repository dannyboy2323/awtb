The diff only changes the default background and text colors in `app/layout.tsx` (from `bg-white text-black` to `bg-black text-white`). This is a UI/styling change with no bearing on environment variables, setup instructions, or any content in `environment-setup.md`.

# Environment Variable Setup

## Overview

This project uses environment variables for all secrets, tokens, and service configuration.
Variables are managed in Vercel and pulled locally — never stored in the repository.

## Initial Setup

### 1. Pull non-sensitive variables from Vercel

```bash
vercel login
vercel link
vercel env pull .env.local
```

This pulls public variables (Sanity project IDs, dataset names, URLs) into `.env.local`.

### 2. Add sensitive variables manually

Sensitive tokens are intentionally excluded from `vercel env pull`. Copy each value from
the Vercel dashboard (`vercel.com → awtb → Settings → Environment Variables`) and add
them to `.env.local` manually.

See [`.env.example`](../.env.example) for the complete list with instructions for
where to find each value.

### 3. Never commit `.env.local`

It is gitignored. If you accidentally stage it:

```bash
git rm --cached .env.local
```

---

## Variable Reference

### Sanity CMS

| Variable                         | Required | Where to find                                                                            |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`  | Yes      | sanity.io/manage → project settings                                                      |
| `NEXT_PUBLIC_SANITY_DATASET`     | Yes      | `production`                                                                             |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Yes      | `2026-06-01`                                                                             |
| `SANITY_API_READ_TOKEN`          | Yes      | sanity.io/manage → API → Tokens                                                          |
| `SANITY_WEBHOOK_SECRET`          | Yes      | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Vercel Storage

| Variable                | Required | Where to find                                      |
| ----------------------- | -------- | -------------------------------------------------- |
| `EDGE_CONFIG`           | Yes      | Vercel dashboard → Storage → Edge Config           |
| `BLOB_READ_WRITE_TOKEN` | Yes      | Vercel dashboard → Storage → Blob → Tokens         |
| `DATABASE_URL`          | Yes      | Vercel dashboard → Storage → Neon (auto-populated) |
| `DATABASE_URL_UNPOOLED` | Yes      | Vercel dashboard → Storage → Neon (auto-populated) |
| `KV_REST_API_URL`       | Yes      | Vercel dashboard → Storage → KV (auto-populated)   |
| `KV_REST_API_TOKEN`     | Yes      | Vercel dashboard → Storage → KV (auto-populated)   |

### Authentication (Clerk)

| Variable                            | Required | Where to find                  |
| ----------------------------------- | -------- | ------------------------------ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | dashboard.clerk.com → API Keys |
| `CLERK_SECRET_KEY`                  | Yes      | dashboard.clerk.com → API Keys |

### Error Monitoring (Sentry)

| Variable                 | Required | Where to find                           |
| ------------------------ | -------- | --------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes      | Sentry project → Settings → Client Keys |
| `SENTRY_AUTH_TOKEN`      | Yes      | sentry.io → Settings → Auth Tokens      |
| `SENTRY_ORG`             | Yes      | Your Sentry organization slug           |
| `SENTRY_PROJECT`         | Yes      | Your Sentry project slug                |

### Analytics (PostHog)

| Variable                            | Required | Where to find                      |
| ----------------------------------- | -------- | ---------------------------------- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Yes      | app.posthog.com → Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST`          | Yes      | `https://us.posthog.com`           |

### Email (Resend)

| Variable         | Required | Where to find         |
| ---------------- | -------- | --------------------- |
| `RESEND_API_KEY` | Yes      | resend.com → API Keys |

### Anthropic AI

| Variable             | Required | Where to find                                |
| -------------------- | -------- | -------------------------------------------- |
| `ANTHROPIC_API_KEY`  | Yes      | platform.claude.com → Settings → API Keys   |

### Monitoring (Checkly)

| Variable             | Required | Where to find                                   |
| -------------------- | -------- | ----------------------------------------------- |
| `CHECKLY_API_KEY`    | Yes      | app.checklyhq.com → Account Settings → API Keys |
| `CHECKLY_ACCOUNT_ID` | Yes      | app.checklyhq.com → Account Settings            |

### App

| Variable               | Required | Where to find                                                           |
| ---------------------- | -------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Yes      | `http://localhost:3000` locally, `https://yourdomain.com` in production |

---

## Adding a New Variable

1. Add it to `lib/env.ts` using zod validation in the correct section (`server` or `client`)
2. Add it to `.env.example` with a comment explaining where to find the value
3. Add it to Vercel via the dashboard for all required environments (Production, Preview, Development)
4. Add it to `.env.local` manually

Client-side variables must be prefixed `NEXT_PUBLIC_`. Server-side variables must not have this prefix.

---

## Rotating Secrets

When rotating a secret (e.g. after accidental exposure):

1. Generate a new value
2. Update it in the Vercel dashboard (Settings → Environment Variables)
3. Update it in `.env.local`
4. Redeploy the production environment: `vercel --prod`
5. If it's a Sanity token, also revoke the old token at sanity.io/manage

---

## CI Environment

The GitHub Actions CI workflow runs on pushes and pull requests targeting the `main` and `staging` branches. It has access to these secrets (set in GitHub Settings → Secrets):

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `SANITY_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`

All other CI steps use hardcoded non-sensitive values (`production` dataset, etc.).

The workflow pins npm to version 11 and notifies Vercel of the check status on completion.