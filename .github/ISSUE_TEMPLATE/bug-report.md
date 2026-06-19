---
name: Bug Report
about: Something is broken or behaving unexpectedly
title: 'bug: '
labels: bug, needs-triage
assignees: dannyboy2323

---

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
