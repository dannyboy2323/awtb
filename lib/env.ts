/**
 * Environment variable validation using @t3-oss/env-nextjs.
 *
 * All required environment variables are declared and validated here.
 * The build fails immediately with a clear error if any required var is missing.
 *
 * Add new variables here as you introduce them — never access
 * process.env directly in application code. Import from this file instead:
 *
 * @example
 * ```ts
 * import { env } from '@/lib/env'
 * const token = env.SANITY_API_READ_TOKEN
 * ```
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables.
   * Never exposed to the browser.
   */
  server: {
    // Resend
    RESEND_API_KEY: z.string().min(1),

    // Neon Postgres
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url(),

    // Clerk
    CLERK_SECRET_KEY: z.string().min(1),

    // Sentry
    SENTRY_ORG: z.string().min(1),
    SENTRY_PROJECT: z.string().min(1),
    SENTRY_AUTH_TOKEN: z.string().min(1),

    // Sanity
    SANITY_API_READ_TOKEN: z.string().min(1),
    SANITY_WEBHOOK_SECRET: z.string().min(1),

    // Vercel Blob
    BLOB_READ_WRITE_TOKEN: z.string().min(1),

    // Upstash Redis
    KV_REST_API_URL: z.string().url(),
    KV_REST_API_TOKEN: z.string().min(1),

    // Node environment
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Client-side environment variables.
   * Must be prefixed with NEXT_PUBLIC_.
   * Safe to expose to the browser.
   */
  client: {
    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

    // PostHog
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),

    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: z.string().url(),

    // Sanity
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
    NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  },

  /**
   * Tells the library how to access env vars at runtime.
   * Required by @t3-oss/env-nextjs for Next.js compatibility.
   */
  runtimeEnv: {
    // Resend
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Neon Postgres
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,

    // Clerk
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

    // PostHog
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,

    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,

    // Server
    SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
    SANITY_WEBHOOK_SECRET: process.env.SANITY_WEBHOOK_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    NODE_ENV: process.env.NODE_ENV,

    // Client
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  /**
   * Skip validation during CI lint/typecheck runs that don't
   * have access to all secrets. The build step always validates.
   */
  skipValidation:
    process.env.CI === "true" && process.env.npm_lifecycle_event !== "build",
});
