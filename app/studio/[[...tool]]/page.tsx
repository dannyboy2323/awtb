"use client";

/**
 * Embeds Sanity Studio inside the Next.js app at /studio.
 * Reuses the Studio configuration from the sanity/ workspace.
 */
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity/sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
