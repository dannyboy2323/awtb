# Security Policy — Postcard Stories

## Supported Versions

Only the latest version deployed to production at
[awtb.vercel.app](https://awtb.vercel.app) is actively maintained and receives
security fixes.

| Environment | Status |
|---|---|
| Production (`main` branch) | ✅ Actively maintained |
| Preview deployments (PR branches) | ⚠️ Best effort |
| Older deployments | ❌ Not supported |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, report it privately using one of
these methods:

### Option A — GitHub Private Security Advisory (preferred)

1. Go to `https://github.com/dannyboy2323/awtb/security/advisories`
2. Click **New draft security advisory**
3. Fill in the details and submit
4. A maintainer will respond within 48 hours

### Option B — Direct contact

Email the maintainer directly at the address on the
[GitHub profile](https://github.com/dannyboy2323). Use the subject line:
`[SECURITY] Postcard Stories — <brief description>`.

---

## What to Include in Your Report

Please provide as much of the following as possible:

- **Type of vulnerability** — e.g. XSS, CSRF, secret exposure, SSRF, injection
- **Affected component** — e.g. `/api/revalidate`, Sanity Studio at `/studio`,
  the postcard grid, Edge Config access
- **Steps to reproduce** — a clear sequence of steps or a proof-of-concept
- **Impact assessment** — what an attacker could achieve by exploiting this
- **Suggested fix** — if you have one (optional but appreciated)

---

## Scope

### In scope

- The Next.js application at `awtb.vercel.app`
- The embedded Sanity Studio at `awtb.vercel.app/studio`
- API routes (`/api/revalidate`, `/api/draft-mode/*`)
- Authentication and session handling
- Exposed environment variables or secrets
- Dependency vulnerabilities with a clear exploitation path in this application

### Out of scope

- Vulnerabilities in Vercel's infrastructure (report to Vercel directly)
- Vulnerabilities in Sanity's platform (report to Sanity directly)
- Vulnerabilities in Upstash's platform (report to Upstash directly)
- Rate limiting that does not bypass authentication or access control
- Self-XSS (requires the attacker to attack themselves)
- Security issues that require physical access to a device
- Social engineering attacks

---

## Our Commitments

- We will acknowledge receipt of your report within **48 hours**
- We will provide an assessment of severity and scope within **5 business days**
- We will keep you informed of our progress while we work on a fix
- We will credit you in the fix commit and/or release notes (unless you prefer anonymity)
- We will not take legal action against researchers who follow this policy in good faith

---

## Disclosure Policy

We follow a **coordinated disclosure** model:

1. You report the vulnerability privately
2. We confirm and assess the issue
3. We develop and test a fix
4. We deploy the fix to production
5. We publicly disclose the vulnerability (after a minimum of 7 days post-fix,
   or sooner by mutual agreement)

We ask that you do not publicly disclose the vulnerability until we have had a
reasonable opportunity to address it.

---

## Known Security Controls

For transparency, here is a summary of the security measures in place:

| Control | Implementation |
|---|---|
| Webhook signature validation | HMAC-SHA256 via `next-sanity/webhook` `parseBody()` |
| Webhook rate limiting | Upstash Redis sliding window (10 req / 60s per IP) |
| Draft Mode protection | Sanity read token required; token validated server-side |
| Studio access | Sanity authentication; CORS restricted to known origins |
| Secret management | All secrets in Vercel environment variables; never in code |
| Dependency scanning | `npm audit` on every CI run |
| Branch protection | No direct pushes to `main`; CI must pass before merge |

---

## Dependency Vulnerabilities

For vulnerabilities in npm dependencies, run:

```bash
npm audit
```

If `npm audit` surfaces a high or critical vulnerability with a known fix:

1. Open a `chore/` PR that updates the affected package
2. Reference the CVE or npm advisory in the PR description
3. Mark it with the `bug` and `chore` labels

For vulnerabilities with no available fix, open a GitHub Security Advisory
so we can track it and assess our exposure.

---

## Hall of Fame

We appreciate everyone who responsibly discloses security issues.
Researchers who report valid vulnerabilities will be listed here (with permission).

*No reports yet — be the first!*
