import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Disables Draft Mode and redirects back to the home page.
 * Visiting this route exits preview and returns to published content.
 */
export async function GET() {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))
}
