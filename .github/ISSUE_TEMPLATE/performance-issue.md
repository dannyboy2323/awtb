---
name: Performance Issue
about: Slow load times, large assets, or Core Web Vitals regressions
title: 'perf: '
labels: needs-triage, performance
assignees: dannyboy2323

---

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
