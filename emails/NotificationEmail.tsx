/**
 * Generic notification email template.
 * Use for system notifications, alerts, and updates.
 */

import { Html, Head, Body, Container, Heading, Text, Hr } from 'react-email'

interface NotificationEmailProps {
  title: string
  message: string
  recipientName?: string
}

export function NotificationEmail({ title, message, recipientName }: NotificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4' }}>
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: '8px',
          }}
        >
          {recipientName && <Text style={{ color: '#555' }}>Hi {recipientName},</Text>}
          <Heading style={{ color: '#0A0E11', fontSize: '20px' }}>{title}</Heading>
          <Text style={{ color: '#555', lineHeight: '1.6' }}>{message}</Text>
          <Hr style={{ margin: '32px 0', borderColor: '#eee' }} />
          <Text style={{ color: '#999', fontSize: '12px' }}>
            This is an automated notification from AWTB.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default NotificationEmail
