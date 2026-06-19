# GitHub Issue Templates — Postcard Stories

> This file documents the issue templates available in this repository.
> Templates live in `.github/ISSUE_TEMPLATE/` and are automatically presented
> when a contributor clicks "New Issue" on GitHub.
>
> For general questions, use GitHub Discussions instead of Issues.

---

## Available Templates

| Template                                   | Use For                                            |
| ------------------------------------------ | -------------------------------------------------- |
| [Bug Report](#bug-report)                  | Something is broken or behaving unexpectedly       |
| [Feature Request](#feature-request)        | Proposing new functionality                        |
| [Content / CMS Issue](#content--cms-issue) | Studio UX, schema, or editor workflow problems     |
| [Performance Issue](#performance-issue)    | Slow load times, large assets, LCP/CLS regressions |
| [Documentation](#documentation)            | Missing, incorrect, or outdated docs               |
| [Chore / Dependency](#chore--dependency)   | Upgrades, tooling, CI, or infrastructure changes   |

---

## Bug Report

**File:** `.github/ISSUE_TEMPLATE/bug_report.yml`

```yaml
name: Bug Report
description: Something is broken or behaving unexpectedly
title: 'bug: '
labels: ['bug', 'needs-triage']
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to file a bug report.
        Please fill out every section — incomplete reports will be closed.

  - type: textarea
    id: description
    attributes:
      label: What happened?
      description: A clear description of the bug.
      placeholder: 'When I click the postcard on the landing page, the link goes to a 404...'
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: What did you expect to happen?
      placeholder: 'I expected to be taken to the story cover page.'
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: Numbered steps that reliably reproduce the bug.
      placeholder: |
        1. Go to https://awtb.vercel.app
        2. Click the featured postcard
        3. Observe 404 error
    validations:
      required: true

  - type: dropdown
    id: environment
    attributes:
      label: Environment
      options:
        - Production (awtb.vercel.app)
        - Preview deployment
        - Local development (localhost:3000)
    validations:
      required: true

  - type: dropdown
    id: device
    attributes:
      label: Device type
      options:
        - Desktop
        - Tablet (portrait)
        - Tablet (landscape)
        - Mobile (portrait)
        - Mobile (landscape)
    validations:
      required: true

  - type: input
    id: browser
    attributes:
      label: Browser & version
      placeholder: 'Safari 17.4 / Chrome 124 / Firefox 125'
    validations:
      required: true

  - type: textarea
    id: console
    attributes:
      label: Console errors (if any)
      description: Open DevTools → Console and paste any red errors.
      render: shell

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots or screen recording
      description: Drag and drop images or a video clip here.

  - type: textarea
    id: additional
    attributes:
      label: Additional context
      description: Anything else that might help us diagnose the issue.
```

---

## Feature Request

**File:** `.github/ISSUE_TEMPLATE/feature_request.yml`

```yaml
name: Feature Request
description: Propose new functionality or an improvement to existing behaviour
title: 'feat: '
labels: ['enhancement', 'needs-triage']
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Feature requests are welcome. Please describe the problem you're
        trying to solve, not just the solution — there may be a better approach.

  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve?
      description: Describe the user need or pain point this feature addresses.
      placeholder: "Readers can't bookmark a specific page within a story — they always have to start from the cover."
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
      description: How do you think this should work?
      placeholder: 'Add a shareable URL for each story page so readers can link directly to page 3 of a story.'
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: What other approaches did you think about?

  - type: dropdown
    id: area
    attributes:
      label: Area
      options:
        - Public reader experience
        - Landing page
        - Story cover page
        - Story reader (panels + prose)
        - Navigation
        - Sanity Studio / CMS
        - Performance
        - SEO / metadata
        - Accessibility
        - Infrastructure / DevOps
        - Other
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: How important is this to you?
      options:
        - Nice to have
        - Would significantly improve the experience
        - Blocking a key use case
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: Additional context
      description: Mockups, references, or related issues.
```

---

## Content / CMS Issue

**File:** `.github/ISSUE_TEMPLATE/cms_issue.yml`

```yaml
name: Content / CMS Issue
description: Problem with Sanity Studio, schema fields, or the editor workflow
title: 'cms: '
labels: ['cms', 'needs-triage']
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Use this template for issues related to the Sanity Studio editor
        at /studio — schema fields, upload behaviour, publish workflow,
        Visual Editing, or any content management concern.

  - type: textarea
    id: description
    attributes:
      label: What is the issue?
      placeholder: 'When I upload a panel image larger than 5MB, the Studio silently fails with no error message.'
    validations:
      required: true

  - type: dropdown
    id: area
    attributes:
      label: Studio area affected
      options:
        - Story document (title, slug, dates)
        - Postcard image upload
        - Cover image upload
        - Pages / panels
        - Prose (rich text)
        - Site Settings (featured story, desk background)
        - Publish / revalidation flow
        - Visual Editing / Presentation tool
        - Draft Mode / preview
        - Other
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. Log in at /studio
        2. Open a Story document
        3. Try to upload a 6MB JPEG as a panel image
        4. Observe silent failure
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behaviour
      placeholder: 'An error message should appear explaining the file size limit.'
    validations:
      required: true

  - type: input
    id: browser
    attributes:
      label: Browser & version
      placeholder: 'Safari 17 / Chrome 124'

  - type: textarea
    id: additional
    attributes:
      label: Additional context
```

---

## Performance Issue

**File:** `.github/ISSUE_TEMPLATE/performance.yml`

```yaml
name: Performance Issue
description: Slow load times, large assets, or Core Web Vitals regressions
title: 'perf: '
labels: ['performance', 'needs-triage']
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Please run a Lighthouse or PageSpeed Insights test before filing
        and include the scores. This helps us baseline the regression.

  - type: textarea
    id: description
    attributes:
      label: What is slow or broken?
      placeholder: 'The landing page hero takes 4+ seconds to display on a 4G mobile connection.'
    validations:
      required: true

  - type: input
    id: url
    attributes:
      label: URL affected
      placeholder: 'https://awtb.vercel.app/'
    validations:
      required: true

  - type: textarea
    id: metrics
    attributes:
      label: Lighthouse / PageSpeed scores
      description: Paste your scores for LCP, FID/INP, CLS, and overall Performance.
      placeholder: |
        LCP: 4.2s
        INP: 380ms
        CLS: 0.12
        Performance score: 54

  - type: dropdown
    id: device
    attributes:
      label: Device & connection tested on
      options:
        - Mobile (Lighthouse simulated 4G)
        - Mobile (real device, WiFi)
        - Mobile (real device, 4G)
        - Desktop (Lighthouse)
        - Desktop (real machine)
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: Additional context
      description: Network waterfall screenshots, HAR files, or profiler traces.
```

---

## Documentation

**File:** `.github/ISSUE_TEMPLATE/documentation.yml`

```yaml
name: Documentation
description: Missing, incorrect, or outdated documentation
title: 'docs: '
labels: ['documentation']
assignees: []

body:
  - type: dropdown
    id: type
    attributes:
      label: Type of documentation issue
      options:
        - Missing documentation (topic not covered)
        - Incorrect documentation (wrong information)
        - Outdated documentation (information has changed)
        - Unclear documentation (confusing or ambiguous)
    validations:
      required: true

  - type: input
    id: location
    attributes:
      label: Where is the documentation issue?
      placeholder: 'README.md → Getting Started → Environment Variables'
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: What is wrong or missing?
      placeholder: "The README says to run `vercel env pull` but doesn't mention that sensitive vars won't be included."
    validations:
      required: true

  - type: textarea
    id: suggestion
    attributes:
      label: Suggested fix or addition
      placeholder: 'Add a note explaining which vars are sensitive and must be added manually from the Upstash console.'
```

---

## Chore / Dependency

**File:** `.github/ISSUE_TEMPLATE/chore.yml`

```yaml
name: Chore / Dependency
description: Dependency upgrades, tooling changes, CI improvements, or infrastructure work
title: 'chore: '
labels: ['chore']
assignees: []

body:
  - type: textarea
    id: description
    attributes:
      label: What needs to be done?
      placeholder: 'Upgrade next-sanity from 13.x to 14.x following the migration guide.'
    validations:
      required: true

  - type: dropdown
    id: area
    attributes:
      label: Area
      options:
        - Dependency upgrade
        - CI / GitHub Actions
        - Tooling (ESLint, Prettier, Vitest, Playwright)
        - Infrastructure (Vercel, Sanity, Upstash, Blob)
        - Build / bundling
        - Security patch
        - Other
    validations:
      required: true

  - type: textarea
    id: motivation
    attributes:
      label: Why is this needed?
      placeholder: 'next-sanity 14 adds support for Sanity v6 and drops the styled-components dependency, reducing bundle size.'
    validations:
      required: true

  - type: textarea
    id: risks
    attributes:
      label: Known risks or breaking changes
      placeholder: 'The Live Content API signature changed — sanityFetch calls will need to be updated.'
```

---

## Setup Instructions

To activate these templates in GitHub, create the template files:

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

Then create each `.yml` file under `.github/ISSUE_TEMPLATE/` using the
content from each template block above. Once pushed to `main`, GitHub
automatically presents the template chooser whenever a contributor
clicks `New Issue`.

### Optional: Blank issue disclaimer

Create `.github/ISSUE_TEMPLATE/config.yml` to disable blank issues
and direct general questions to Discussions:

```yaml
blank_issues_enabled: false
contact_links:
  - name: General Questions
    url: https://github.com/dannyboy2323/awtb/discussions
    about: For questions that are not bugs or feature requests, use Discussions.
```

---

## Issue Labels Reference

Set these up at github.com/dannyboy2323/awtb/labels:

| Label              | Colour    | Description                         |
| ------------------ | --------- | ----------------------------------- |
| `bug`              | `#d73a4a` | Something is broken                 |
| `enhancement`      | `#a2eeef` | New feature or improvement          |
| `cms`              | `#f9d0c4` | Sanity Studio / content management  |
| `performance`      | `#e4e669` | Speed, bundle size, Core Web Vitals |
| `documentation`    | `#0075ca` | Docs improvements                   |
| `chore`            | `#e4e669` | Maintenance, upgrades, tooling      |
| `needs-triage`     | `#ededed` | Not yet reviewed by a maintainer    |
| `good first issue` | `#7057ff` | Good for newcomers                  |
| `help wanted`      | `#008672` | Extra attention needed              |
| `wontfix`          | `#ffffff` | Will not be addressed               |
| `duplicate`        | `#cfd3d7` | Already reported                    |
| `blocked`          | `#b60205` | Waiting on something external       |
