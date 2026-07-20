/**
 * Neon serverless Postgres client with Drizzle ORM.
 *
 * Uses the pooled connection URL for most queries.
 * Use DATABASE_URL_UNPOOLED for migrations and long-running transactions.
 *
 * @example
 * ```ts
 * import { db } from '@/db'
 * import { users } from '@/db/schema'
 * const allUsers = await db.select().from(users)
 * ```
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/db/schema'

const sql = neon(process.env.DATABASE_URL!)

/** Drizzle client backed by the pooled Neon serverless connection. */
export const db = drizzle(sql, { schema })
/** Type of the configured application database client. */
export type DB = typeof db
