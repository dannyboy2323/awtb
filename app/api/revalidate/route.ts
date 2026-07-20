import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { validateSanityWebhook } from '@/sanity/lib/webhook'
import { webhookRatelimit } from '@/lib/redis'

/**
 * Receives Sanity publish events and purges the ISR cache.
 * Protected by HMAC signature validation and rate limiting.
 */
export async function POST(req: NextRequest) {
  // Rate limit by source IP
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await webhookRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await validateSanityWebhook(req)

    if (!body) {
      return NextResponse.json({ error: 'Empty webhook payload' }, { status: 400 })
    }

    // Revalidate all cached story data immediately (expire: 0 = no stale window)
    revalidateTag('stories', { expire: 0 })
    revalidatePath('/', 'layout')

    if (body._type === 'story') {
      revalidatePath('/stories/[slug]', 'page')
      revalidatePath('/stories/[slug]/[page]', 'page')
    }

    return NextResponse.json({
      revalidated: true,
      type: body._type,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
