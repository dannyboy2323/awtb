/**
 * Resend email client.
 *
 * Use this module for all outgoing email — transactional messages,
 * notifications, and mailing list broadcasts via Resend Broadcasts.
 *
 * @example Send a transactional email:
 * ```ts
 * import { sendEmail } from '@/lib/email'
 * import { WelcomeEmail } from '@/emails/WelcomeEmail'
 *
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   react: <WelcomeEmail name="Danny" />,
 * })
 * ```
 */

import { Resend } from 'resend'
import type { ReactNode } from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

/** Default from address — update to your verified domain in Resend */
const DEFAULT_FROM = 'noreply@awtb.vercel.app'

/** Supported fields for one transactional Resend message. */
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react?: ReactNode
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

/**
 * Sends a transactional email via Resend.
 * Throws on failure — wrap in try/catch in API routes.
 */
export async function sendEmail(options: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: options.from ?? DEFAULT_FROM,
    to: options.to,
    subject: options.subject,
    react: options.react,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}

export { resend }
