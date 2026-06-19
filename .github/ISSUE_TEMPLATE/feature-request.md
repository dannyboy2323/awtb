---
name: Feature Request
about: Propose new functionality or an improvement to existing behavior
title: 'feat: '
labels: enhancement, needs-triage
assignees: dannyboy2323

---

name: Feature Request
description: Propose new functionality or an improvement to existing behavior
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
