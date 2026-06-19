import { parseBody } from 'next-sanity/webhook'
import type { NextRequest } from 'next/server'

/**
 * Validates an incoming Sanity webhook request using HMAC signature.
 * Throws if the signature is invalid — never trust unvalidated webhooks.
 */
export async function validateSanityWebhook(req: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) throw new Error('SANITY_WEBHOOK_SECRET is not set')

  const { body, isValidSignature } = await parseBody<{ _type: string }>(req, secret)

  if (!isValidSignature) {
    throw new Error('Invalid webhook signature')
  }

  return body
}
