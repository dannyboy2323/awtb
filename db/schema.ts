/**
 * Drizzle ORM schema — database table definitions.
 *
 * Add new tables here. Run `npm run db:push` to apply changes to the database.
 * Run `npm run db:generate` to generate a SQL migration file instead.
 *
 * @example Adding a new table:
 * ```ts
 * export const posts = pgTable('posts', {
 *   id: serial('id').primaryKey(),
 *   title: text('title').notNull(),
 *   createdAt: timestamp('created_at').defaultNow().notNull(),
 * })
 * ```
 */

import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core'

/**
 * Example users table — extend or replace for your project.
 * Clerk handles authentication; this table stores app-specific user data.
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/** Persisted user record inferred from the Drizzle schema. */
export type User = typeof users.$inferSelect
/** Insertable user record inferred from the Drizzle schema. */
export type NewUser = typeof users.$inferInsert
