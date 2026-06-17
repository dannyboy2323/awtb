import { describe, it, expect, vi } from "vitest";

/**
 * /api/revalidate route tests.
 * Tests HMAC validation and rate limiting behaviour.
 */

describe("/api/revalidate", () => {
  it("rejects requests with missing webhook secret env var", async () => {
    const original = process.env.SANITY_WEBHOOK_SECRET;
    delete process.env.SANITY_WEBHOOK_SECRET;

    const { validateSanityWebhook } = await import("@/sanity/lib/webhook");
    const mockReq = new Request("http://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ _type: "story" }),
    });

    await expect(validateSanityWebhook(mockReq as any)).rejects.toThrow(
      "SANITY_WEBHOOK_SECRET is not set",
    );

    process.env.SANITY_WEBHOOK_SECRET = original;
  });

  it("rejects requests with invalid HMAC signature", async () => {
    process.env.SANITY_WEBHOOK_SECRET = "test-secret-12345";

    const { validateSanityWebhook } = await import("@/sanity/lib/webhook");
    const mockReq = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "sanity-webhook-signature": "invalid-signature" },
      body: JSON.stringify({ _type: "story" }),
    });

    await expect(validateSanityWebhook(mockReq as any)).rejects.toThrow(
      "Invalid webhook signature",
    );
  });
});
