/**
 * Clerk authentication middleware.
 *
 * Controls which routes require authentication.
 * Currently configured to leave all routes public by default.
 *
 * To protect a route, add it to the matcher or use auth().protect()
 * inside individual route handlers.
 *
 * @example Protecting a specific route:
 * ```ts
 * import { auth } from '@clerk/nextjs/server'
 * export default async function Page() {
 *   const { userId } = await auth()
 *   if (!userId) redirect('/sign-in')
 * }
 * ```
 */
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
