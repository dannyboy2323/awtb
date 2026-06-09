import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Upstash Redis client using Vercel KV integration variable names.
 * The Vercel KV integration provides KV_REST_API_URL and KV_REST_API_TOKEN
 * instead of the default UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
 */
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

/**
 * Rate limiter for the /api/revalidate webhook endpoint.
 * Allows 10 requests per 60 seconds per source IP.
 */
export const webhookRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "postcard-stories:webhook",
});
