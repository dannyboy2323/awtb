import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 * Used by `npm run db:push`, `npm run db:generate`, and `npm run db:studio`.
 */
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
  verbose: true,
  strict: true,
});
