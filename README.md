
# Postcard Stories

> A graphic-novel storytelling platform. Readers enter each story through a postcard;
> inside, graphic-novel panels and prose are presented side by side, page by page.

[![CI](https://github.com/dannyboy2323/awtb/actions/workflows/ci.yml/badge.svg)](https://github.com/dannyboy2323/awtb/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Sanity](https://img.shields.io/badge/CMS-Sanity-F03E2F?logo=sanity&logoColor=white)](https://www.sanity.io/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://awtb.vercel.app)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [Content Management (Sanity Studio)](#content-management-sanity-studio)
- [Testing](#testing)
- [Git Workflow & Contributing](#git-workflow--contributing)
  - [Branching Strategy](#branching-strategy)
  - [Commit Message Convention](#commit-message-convention)
  - [Creating a Pull Request (Step by Step)](#creating-a-pull-request-step-by-step)
  - [Code Review & CI Checks](#code-review--ci-checks)
  - [Merging](#merging)
- [Deployment](#deployment)
- [Issue Tracking](#issue-tracking)
- [License](#license)

---

## About

Postcard Stories is a Next.js application backed by an embedded Sanity Studio. Non-technical
editors manage content — postcards, cover images, graphic-novel panels, and prose — entirely
through the Studio at `/studio`. Publishing a story triggers a webhook that revalidates the
production cache within seconds, so readers always see the latest content without a redeploy.

**Live site:** [awtb.vercel.app](https://awtb.vercel.app)
**Embedded Studio:** [awtb.vercel.app/studio](https://awtb.vercel.app/studio)

---

## Tech Stack

| Layer                 | Technology                                                                    | Purpose                                                   |
| --------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| Framework             | [Next.js 16](https://nextjs.org) (App Router, Turbopack)                      | Server Components, ISR, on-demand revalidation            |
| Language              | [TypeScript](https://www.typescriptlang.org/)                                 | End-to-end type safety, including generated content types |
| CMS                   | [Sanity](https://www.sanity.io/) (embedded Studio at `/studio`)               | Structured content, Visual Editing, Live Content API      |
| Hosting               | [Vercel](https://vercel.com)                                                  | Production hosting, preview deployments, ISR              |
| Key-Value Store       | [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)             | Sub-millisecond reads for the featured story pointer      |
| Object Storage        | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)                    | Static UI assets (desk background, etc.)                  |
| Cache / Rate Limiting | [Upstash Redis](https://upstash.com) via Vercel Marketplace                   | Webhook rate limiting, query caching                      |
| Styling               | [Tailwind CSS](https://tailwindcss.com)                                       | Utility-first styling                                     |
| Unit Testing          | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | Fast unit/integration tests                               |
| E2E Testing           | [Playwright](https://playwright.dev)                                          | Full browser test coverage                                |
| CI/CD                 | [GitHub Actions](https://github.com/features/actions)                         | Typecheck, lint, and test on every push/PR                |
| Formatting            | [Prettier](https://prettier.io) + Tailwind plugin                             | Consistent code style                                     |
| Linting               | [ESLint](https://eslint.org)                                                  | Code quality enforcement                                  |

---

## Project Structure

```
awtb/
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI pipeline: typecheck, lint, unit tests
├── app/
│   ├── [slug]/page.tsx             # Generic CMS-driven page route
│   ├── posts/[slug]/page.tsx       # Blog post route (template)
│   ├── studio/[[...tool]]/page.tsx # Embedded Sanity Studio at /studio
│   ├── api/
│   │   ├── draft-mode/
│   │   │   ├── enable/route.ts     # Enables preview/draft mode
│   │   │   └── disable/route.ts    # Disables preview/draft mode
│   │   └── revalidate/route.ts     # Sanity webhook → ISR cache purge
│   ├── components/                 # Shared UI components
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── sitemap.ts
├── lib/
│   ├── edge-config.ts              # Featured story slug reader (Edge Config)
│   └── redis.ts                    # Upstash Redis client + webhook rate limiter
├── sanity/
│   ├── lib/
│   │   ├── api.ts                  # projectId, dataset, apiVersion, studioUrl
│   │   ├── client.ts               # Configured Sanity client
│   │   ├── live.ts                 # Live Content API (defineLive)
│   │   ├── queries.ts              # All GROQ queries (typed via TypeGen)
│   │   ├── token.ts                # Read token for Draft Mode
│   │   ├── utils.ts                # urlForImage, linkResolver, dataAttr
│   │   └── webhook.ts              # HMAC signature validation
│   ├── src/
│   │   ├── schemaTypes/
│   │   │   ├── documents/          # story, storyPage, page, post, person
│   │   │   ├── objects/            # panel, blockContent, link, button...
│   │   │   ├── singletons/         # settings, siteSettings
│   │   │   └── index.ts
│   │   └── structure/index.ts      # Studio sidebar structure
│   ├── sanity.config.ts
│   └── sanity.cli.ts
├── tests/
│   ├── unit/                       # Vitest tests
│   └── e2e/                        # Playwright tests
├── public/
├── .env.example                    # Documented env var template
├── sanity.schema.json              # Generated schema export
├── sanity.types.ts                 # Generated TypeScript types (do not edit)
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js 22.x** (LTS) — `node -v`
- **npm 10.x** — `npm -v`
- **Git** with SSH access to GitHub configured
- **Vercel CLI** — `npm install -g vercel`
- Access to the project's Sanity organization (ask a maintainer for an invite)

### Clone & Install

```bash
git clone git@github.com:dannyboy2323/awtb.git
cd awtb
npm install
```

### Environment Variables

This project pulls environment variables from Vercel rather than managing them by hand.

```bash
vercel login
vercel link        # link to the dkb23/awtb project when prompted
vercel env pull .env.local
```

Some sensitive variables (Sanity tokens, webhook secret, Upstash credentials) are not
included in `vercel env pull` and must be added manually to `.env.local`. See
[`.env.example`](.env.example) for the full list of required variables and where to find
each value. **Never commit `.env.local`** — it is gitignored.

### Running Locally

```bash
npm run dev
```

This runs `predev` first (which regenerates Sanity types), then starts Next.js with Turbopack.

- App: [http://localhost:3000](http://localhost:3000)
- Studio: [http://localhost:3000/studio](http://localhost:3000/studio)

---

## Available Scripts

| Command                 | What it does                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`           | Starts the Next.js dev server (Turbopack). Runs `typegen` first.                                |
| `npm run build`         | Production build. Runs `sanity typegen generate` first (`prebuild`).                            |
| `npm run start`         | Starts the production server (run `build` first).                                               |
| `npm run typegen`       | Extracts the Sanity schema and regenerates `sanity.types.ts`. Run this after any schema change. |
| `npm run type-check`    | Runs Next.js's type generation plus a full `tsc --noEmit` check.                                |
| `npm run lint`          | Runs ESLint across the project.                                                                 |
| `npm run lint:fix`      | Runs ESLint and auto-fixes issues where possible.                                               |
| `npm run format`        | Formats the entire codebase with Prettier.                                                      |
| `npm run format:check`  | Checks formatting without writing changes (used in CI).                                         |
| `npm test`              | Runs all Vitest unit tests once.                                                                |
| `npm run test:watch`    | Runs Vitest in watch mode for active development.                                               |
| `npm run test:ui`       | Opens the Vitest UI for interactive test running.                                               |
| `npm run test:coverage` | Runs unit tests with a coverage report.                                                         |
| `npm run test:e2e`      | Runs Playwright end-to-end tests.                                                               |
| `npm run test:e2e:ui`   | Runs Playwright tests in interactive UI mode.                                                   |
| `npm run test:all`      | Runs unit tests followed by E2E tests — the full local pre-merge check.                         |

> Before opening a pull request, run `npm run type-check && npm run lint && npm test` locally.
> This mirrors what CI checks automatically.

---

## Content Management (Sanity Studio)

Non-technical editors manage all story content through the embedded Studio at `/studio`
(no separate login portal, no separate deployment).

**Content model:**

| Type           | Description                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `story`        | Top-level document: title, slug, publish date, postcard image, cover image, and an ordered array of pages. |
| `storyPage`    | One page within a story: an ordered array of `panel`s (left column) and `prose` (right column, rich text). |
| `panel`        | A single graphic-novel image with alt text and an optional caption.                                        |
| `siteSettings` | Singleton: which story is featured above the fold, and the landing page's desk background image.           |

**Editor workflow:**

1. Log in at `/studio`.
2. Open **Stories** → **Create** to start a new story.
3. Upload the **Postcard Image** and **Cover Image**.
4. Add **Pages** — each page gets one or more **Panels** (drag to reorder) and a **Prose** field.
5. Click **Publish**. A webhook fires automatically, purging the production cache within seconds.
6. To feature a story above the fold on the landing page, open **Site Settings** and set
   **Featured Story**, then publish.

---

## Testing

### Unit Tests (Vitest)

```bash
npm test              # run once
npm run test:watch    # watch mode during development
npm run test:coverage # with coverage report
```

Unit tests live in `tests/unit/`. They cover utility functions (image URL building,
environment validation, GROQ query shapes) using `jsdom` and Testing Library.

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

E2E tests live in `tests/e2e/` and cover full user flows: landing → postcard → cover →
page-flip navigation, and the editorial publish → revalidation flow.

---

## Git Workflow & Contributing

The `main` branch is protected: direct pushes are restricted, and pull requests must pass
CI (the `test` job in `.github/workflows/ci.yml`) before merging.

### Branching Strategy

Create a new branch off `main` for every change — never commit directly to `main`.

```bash
git checkout main
git pull origin main
git checkout -b feat/short-description
```

**Branch prefixes:**

| Prefix      | Use for                                    |
| ----------- | ------------------------------------------ |
| `feat/`     | New features                               |
| `fix/`      | Bug fixes                                  |
| `chore/`    | Tooling, dependencies, config              |
| `docs/`     | Documentation only                         |
| `refactor/` | Code restructuring with no behavior change |
| `test/`     | Adding or fixing tests                     |

### Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>: <short description>

[optional longer body]
```

| Type       | Use for                                             |
| ---------- | --------------------------------------------------- |
| `feat`     | A new feature                                       |
| `fix`      | A bug fix                                           |
| `docs`     | Documentation changes                               |
| `style`    | Formatting, no code change                          |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `test`     | Adding or correcting tests                          |
| `chore`    | Build process, dependencies, tooling                |
| `ci`       | CI configuration changes                            |

**Examples:**

```bash
git commit -m "feat: add page-flip navigation to story reader"
git commit -m "fix: correct panel ordering on mobile layout"
git commit -m "docs: update environment variable setup instructions"
```

### Creating a Pull Request (Step by Step)

This section assumes you're new to the GitHub workflow — follow these steps in order.

**1. Make sure you're starting from the latest `main`:**

```bash
git checkout main
git pull origin main
```

**2. Create your feature branch:**

```bash
git checkout -b feat/add-page-navigation
```

**3. Make your code changes** in VS Code.

**4. Check your work before committing:**

```bash
npm run type-check
npm run lint
npm test
```

Fix any errors before proceeding.

**5. Stage and commit your changes:**

```bash
git add -A
git status   # review what's being committed — confirm no .env files are listed
git commit -m "feat: add page navigation buttons to story reader"
```

**6. Push your branch to GitHub:**

```bash
git push -u origin feat/add-page-navigation
```

The `-u` flag only needs to be used the first time you push this branch — it links your
local branch to the remote one. After that, `git push` alone is sufficient.

**7. Open the Pull Request:**

- Go to `https://github.com/dannyboy2323/awtb`
- You'll see a banner: **"feat/add-page-navigation had recent pushes"** with a
  **"Compare & pull request"** button — click it
- Fill in:
  - **Title:** a short summary (e.g. "Add page navigation buttons to story reader")
  - **Description:** what changed and why. If it closes an issue, write `Closes #12`
- Click **Create pull request**

**8. Wait for CI to run.** The `test` job will automatically run typecheck, lint, and
unit tests. You'll see a yellow dot (running), then a green check (passed) or red X
(failed) next to your PR.

**9. If CI fails:** fix the issue locally, then:

```bash
git add -A
git commit -m "fix: address CI failure"
git push
```

The PR updates automatically — no need to open a new one.

### Code Review & CI Checks

- At least one approving review is recommended before merging.
- The `test` status check **must** pass — this is enforced by branch protection.
- Reviewers may leave comments requesting changes — push additional commits to the same
  branch to address them.

### Merging

Once approved and CI is green:

1. On the PR page, click **Squash and merge** (keeps `main`'s history clean — one commit per PR).
2. Edit the commit message if needed (it defaults to the PR title).
3. Click **Confirm squash and merge**.
4. Click **Delete branch** (cleans up the remote branch — your local branch can be deleted with
   `git branch -d feat/add-page-navigation`).
5. Update your local `main`:

```bash
git checkout main
git pull origin main
```

---

## Example PR Workflow

The full PR workflow:

```bash
npm run type-check
npm test
```

If both pass, commit and push:

```bash
git add -A
git commit -m "fix: remove unused imports flagged by eslint"
git push -u origin fix/lint-warnings
```

The pre-push hook will run automatically (type-check, lint, test) — should take ~3 seconds. Then go to GitHub, open the PR, wait for CI to go green, squash and merge, then sync local main:

```bash
git checkout main
git pull origin main
git branch -d fix/lint-warnings
```

---

## Deployment

Deployment is fully automatic via Vercel:

- **Push to `main`** → deploys to production at [awtb.vercel.app](https://awtb.vercel.app)
- **Open a PR** → Vercel creates a unique preview deployment URL, posted as a comment on the PR

No manual deploy steps are required. To deploy manually (rare — e.g. for testing env var
changes):

```bash
vercel --prod
```

### Content Publishing

Publishing content in Sanity Studio is independent of code deployment. When an editor
clicks **Publish**, a webhook calls `/api/revalidate`, which purges the relevant ISR cache —
no rebuild or redeploy needed.

---

## Issue Tracking

We use [GitHub Issues](https://github.com/dannyboy2323/awtb/issues) for bugs, features, and tasks.

**When filing an issue:**

- Use a clear, descriptive title (e.g. "Postcard grid doesn't wrap on mobile" not "bug")
- Include steps to reproduce for bugs, or acceptance criteria for features
- Apply labels where relevant: `bug`, `enhancement`, `documentation`, `good first issue`

**Linking issues to PRs:**

Reference the issue number in your PR description using a closing keyword so the issue
closes automatically on merge:

```
Closes #12
Fixes #8
```

---

## License

This project is licensed under the [MIT License](LICENSE).
