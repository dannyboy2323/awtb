/**
 * Sanity CLI Configuration
 * Configures schema extraction and TypeGen for the combined Next.js + Sanity project.
 * Learn more: https://www.sanity.io/docs/cli
 */

import { defineCliConfig } from "sanity/cli";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "d205mlci";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  typegen: {
    path: "./sanity/**/*.{ts,tsx,js,jsx}",
    schema: "./sanity.schema.json",
    generates: "./sanity.types.ts",
    overloadClientMethods: true,
  },
});
