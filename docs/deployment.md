The diff only modifies CSS rules in `story-reader.css` — adding a `bottom: 5px` rule for `.page-number` in portrait and a `right: 5rem` rule for `.page-number--right` on desktop landscape. None of this affects deployment, environment variables, CI, database migrations, rollbacks, monitoring, or any other topic covered in `deployment.md`.

# Deployment Guide

## Overview

Deployment is fully automated via Vercel. There are three environments:

| Environment | Branch        | URL                       | Purpose               |
| ----------- | ------------- | ------------------------- | --------------------- |
| Development | local         | localhost:3000            | Local development     |
| Preview     | any PR branch | auto-generated Vercel URL | Review before merging |
| Production  | `main`        | awtb.vercel.app           | Live site             |

---

## Automatic Deployments

### Production

Every merge to `main` triggers an automatic production deployment. No manual steps needed.

You can monitor deployments at: vercel.com/dkb23/awtb → Deployments tab.

### Preview

Every pull request automatically gets a unique preview URL posted as a comment on the PR.
Preview deployments use the same environment variables as production (configured per
environment in the Vercel dashboard).

---

## Manual Deployment

Rarely needed — use only for testing environment variable changes or emergency rollbacks.

```bash
# Deploy to production
vercel --prod

# Deploy to preview (creates a one-off preview URL)
vercel
```

---

## Content Publishing

Publishing content in Sanity Studio is **independent of code deployment**.

When an editor clicks **Publish** in the Studio at `/studio`:

1. Sanity sends a webhook to `/api/revalidate`
2. The webhook validates the HMAC signature and rate-limits by IP
3. `revalidatePath()` purges the ISR cache for affected routes
4. The production site reflects the new content within seconds

No redeploy is needed for content changes.

---

## Environment Variables

All environment variables are managed in the Vercel dashboard:
vercel.com → awtb project → Settings → Environment Variables

When adding a new variable:

1. Add it via the Vercel dashboard (not the CLI) so it syncs to all environments
2. Add it to `.env.local` manually for local development
3. Add it to `.env.example` with documentation

→ **[Full environment variable reference](environment-setup.md)**

---

## Database Migrations

Schema changes to the Neon Postgres database require a migration step.

```bash
# Push schema changes directly (development/staging)
npm run db:push

# Generate a migration file (production — review before applying)
npm run db:generate

# Apply pending migrations
npm run db:migrate
```

For production database changes:

1. Test the migration locally with `npm run db:push`
2. Generate a migration file with `npm run db:generate`
3. Review the generated SQL in `db/migrations/`
4. Apply with `npm run db:migrate` against the production database

---

## Rollback

### Code rollback

In the Vercel dashboard, go to Deployments → find the previous successful deployment →
click the `...` menu → **Promote to Production**. This instantly rolls back without
a new build.

### Content rollback

In Sanity Studio, open the document → click the clock icon (History) → select a
previous version → click **Restore**. Publishing the restored version triggers the
webhook and updates the cache automatically.

### Database rollback

Drizzle doesn't support automatic rollbacks. For schema rollbacks:

1. Write a reverse migration in `db/migrations/`
2. Apply it manually via `npm run db:migrate`

For data rollbacks, use the Neon console (console.neon.tech) to restore from a
point-in-time backup.

---

## Monitoring

### Error monitoring (Sentry)

Runtime errors in production are captured automatically by Sentry.
Dashboard: [awtb-monitoring.sentry.io](https://awtb-monitoring.sentry.io)

### Uptime monitoring (Checkly)

Checkly runs browser checks against production every 10 minutes from two global locations.
Dashboard: [app.checklyhq.com](https://app.checklyhq.com)

### Analytics (PostHog + Vercel)

- Product analytics: [app.posthog.com](https://app.posthog.com)
- Web analytics: vercel.com → awtb project → Analytics tab
- Speed Insights: vercel.com → awtb project → Speed Insights tab

---

## CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on pushes to `main` and `staging`, and
on pull requests targeting either branch. It runs the following steps in order:

1. TypeScript check
2. Lint
3. Security audit
4. Notifies Vercel of the check status via `vercel/repository-dispatch`

The workflow pins npm to version 11 and uses `npm install` rather than `npm ci`.

The workflow requires `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_WEBHOOK_SECRET`, and
`GITHUB_TOKEN` to be set as repository secrets.

---

## AI Docs Maintenance

A GitHub Actions workflow (`.github/workflows/ai-docs.yml`) runs on every push to `main`
and uses Claude to review code changes against the `/docs` directory. If any documentation
is found to be inaccurate or missing information, Claude updates the relevant files and
opens a pull request for human review before merging.

The workflow requires `ANTHROPIC_API_KEY` to be set as a repository secret.

---

## Sanity Webhook Configuration

The production webhook is registered at:
sanity.io/manage → d205mlci → API → Webhooks → "Vercel ISR Revalidation"

Settings:

- URL: `https://awtb.vercel.app/api/revalidate`
- Trigger on: Create, Update, Delete
- Filter: `_type in ["story", "siteSettings"]`
- Projection: `{_type}`
- Secret: value of `SANITY_WEBHOOK_SECRET` env var