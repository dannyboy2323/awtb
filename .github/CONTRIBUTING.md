# Contributing to Postcard Stories

Thank you for taking the time to contribute. This document covers everything
you need to know to get your change into the codebase cleanly and efficiently.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Code Style](#code-style)
- [Sanity Schema Changes](#sanity-schema-changes)
- [Environment Variables](#environment-variables)
- [Questions](#questions)

---

## Code of Conduct

Be respectful. Critique code, not people. Assume good intent.
PRs and issues that are rude, dismissive, or hostile will be closed.

---

## Getting Started

### Prerequisites

- Node.js ≥ 22 — `node -v`
- npm ≥ 10 — `npm -v`
- Git with SSH access to GitHub configured
- Access to the project's Vercel and Sanity organizations

### Setup

```bash
# Clone the repo
git clone git@github.com:dannyboy2323/awtb.git
cd awtb

# Install dependencies
npm install

# Pull environment variables from Vercel
vercel login
vercel link
vercel env pull .env.local

# Add any sensitive vars not included in the pull (see .env.example)
# Then start the dev server
npm run dev
```

Visit `http://localhost:3000` and `http://localhost:3000/studio` to confirm everything works.

---

## Development Workflow

### 1. Always branch from an up-to-date `main`

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

Use one of these branch prefixes:

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, config |
| `refactor/` | Code restructuring |
| `test/` | Adding or fixing tests |
| `perf/` | Performance improvements |

### 2. Make your changes

Write your code. Run the dev server to verify your changes look and work correctly.

### 3. Run the full check before pushing

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm test             # Vitest unit tests
```

All three must pass with zero errors. The pre-push Git hook enforces this automatically —
if any check fails, the push will be blocked and you'll see the error in the terminal.

### 4. Commit

```bash
git add -A
git status   # confirm .env.local is NOT listed
git commit -m "feat: short description of what changed"
```

See [Commit Messages](#commit-messages) for the full convention.

### 5. Push and open a PR

```bash
git push -u origin feat/your-feature-name
```

Go to GitHub — you'll see a banner with a "Compare & pull request" button. Click it,
fill in the PR template, and submit.

### 6. After merge

```bash
git checkout main
git pull origin main
git branch -d feat/your-feature-name
```

---

## Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>: <short description in present tense, lowercase>

[optional body — explain WHY, not WHAT]

[optional footer — Closes #X]
```

### Types

| Type | When to use |
|---|---|
| `feat` | Adding new functionality |
| `fix` | Fixing a bug |
| `docs` | Documentation changes only |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Restructuring code without changing behaviour |
| `test` | Adding or correcting tests |
| `chore` | Build scripts, dependencies, CI, tooling |
| `perf` | Performance improvement |
| `ci` | CI configuration changes |

### Examples

```bash
git commit -m "feat: add page-flip navigation to story reader"
git commit -m "fix: postcard grid breaks at 375px viewport width"
git commit -m "chore: upgrade next-sanity from 13 to 14"
git commit -m "docs: add Sanity schema change instructions to CONTRIBUTING"
```

### Rules

- Subject line ≤ 72 characters
- Use the imperative mood: "add feature" not "added feature"
- No period at the end of the subject line
- Reference issues in the footer: `Closes #42`

---

## Pull Request Process

1. **Fill in the PR template completely.** Incomplete PRs will be sent back.
2. **One concern per PR.** Don't bundle unrelated changes.
3. **Keep PRs small.** A PR that changes 5 files is easier to review than one that changes 50.
4. **CI must be green** before a PR can be merged. The `test` job runs:
   - TypeScript check (`npm run type-check`)
   - ESLint (`npm run lint`)
   - Vitest unit tests (`npm test`)
5. **Vercel preview deployment** is created automatically for every PR.
   Include the preview URL in your PR description for UI changes.
6. **Squash and merge** is the merge strategy. Your commits are squashed into
   one commit on `main` — the commit message is the PR title.
7. **Delete your branch** after merge (GitHub prompts you automatically).

---

## Testing Requirements

### Unit tests

Every new utility function must have at least one unit test in `tests/unit/`.

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Tests use [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com).

### End-to-end tests

For changes that affect user-facing flows (landing page, story reader, navigation),
add or update a Playwright test in `tests/e2e/`.

```bash
npm run test:e2e        # run headless
npm run test:e2e:ui     # interactive mode
```

### What does not need a test

- Pure markup/styling changes with no logic
- Documentation-only changes
- Config file changes (these are caught by the TypeScript check)

---

## Code Style

Formatting and linting are enforced automatically.

```bash
npm run format        # auto-fix with Prettier
npm run format:check  # check without writing
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
```

### Key conventions

- **TypeScript everywhere.** No `.js` files in `app/`, `components/`, `lib/`, or `sanity/`.
- **No `any`.** Use proper types or `unknown`. `any` will fail the lint check.
- **Named exports** for components and utilities. Default exports only for Next.js page and layout files.
- **Docstring comments** on every exported function and component.
- **No hardcoded secrets.** All credentials and tokens must come from environment variables.

---

## Sanity Schema Changes

Schema changes require extra care — they affect live content and the Studio UI for editors.

### Process

1. Edit schema files in `sanity/src/schemaTypes/`
2. Run `npm run typegen` to regenerate `sanity.types.ts`
3. Confirm `sanity.types.ts` has been updated and commit it alongside the schema change
4. Verify the Studio loads correctly at `http://localhost:3000/studio`
5. Verify your changes work against the test story in the `production` dataset

### Rules

- **New fields must have defaults or be optional.** Adding a required field to an
  existing document type without a default will break validation for all existing documents.
- **Never rename a field in place.** Instead, add the new field, migrate content,
  then remove the old field in a separate PR.
- **Schema changes and content migrations are separate PRs.**
- Always update the `docs/editor-guide.md` if the change affects the editor workflow.

---

## Environment Variables

- **Never commit `.env.local`.** It is gitignored. Committing it exposes secrets.
- **Never hardcode values** that belong in environment variables.
- **Document every new variable** in `.env.example` with a comment explaining
  where to find the value.
- **Add new variables to Vercel** via `vercel env add VAR_NAME` for all
  required environments.

See `.env.example` for the full list of required variables and where to obtain each one.

---

## Questions

For questions that don't fit a bug report or feature request, use
[GitHub Discussions](https://github.com/dannyboy2323/awtb/discussions).

For urgent issues affecting production, open a bug report and label it `bug` + `blocked`.
