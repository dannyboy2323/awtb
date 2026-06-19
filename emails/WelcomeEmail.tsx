/**
 * Welcome email template.
 * Sent when a new user signs up.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from "react-email";

interface WelcomeEmailProps {
  name: string;
  loginUrl?: string;
}

export function WelcomeEmail({
  name,
  loginUrl = "https://awtb.vercel.app",
}: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f4" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            padding: "40px",
            borderRadius: "8px",
          }}
        >
          <Heading style={{ color: "#0A0E11", fontSize: "24px" }}>
            Welcome to AWTB, {name}!
          </Heading>
          <Text style={{ color: "#555", lineHeight: "1.6" }}>
            Thanks for joining. You can now access your account and start
            exploring stories.
          </Text>
          <Button
            href={loginUrl}
            style={{
              backgroundColor: "#0A0E11",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "4px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Get Started
          </Button>
          <Hr style={{ margin: "32px 0", borderColor: "#eee" }} />
          <Text style={{ color: "#999", fontSize: "12px" }}>
            You received this email because you signed up for AWTB.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
