import { defineConfig } from "checkly";

/**
 * Checkly synthetic monitoring configuration for Postcard Stories.
 *
 * Runs browser checks against production every 10 minutes
 * from US and EU locations. Alerts on failure.
 *
 * Deploy: npx checkly deploy
 * Test locally: npx checkly test
 */
const config = defineConfig({
  projectName: "awtb",
  logicalId: "awtb",
  repoUrl: "https://github.com/dannyboy2323/awtb",
  checks: {
    frequency: 10,
    locations: ["us-east-1", "eu-central-1", "ap-southeast-1"],
    tags: ["production"],
    runtimeId: "2025.04",
    checkMatch: "**/__checks__/**/*.check.ts",
    playwrightConfig: {
      use: {
        baseURL: "https://awtb.vercel.app",
      },
    },
    browserChecks: {
      testMatch: "**/__checks__/**/*.spec.ts",
    },
  },
  cli: {
    runLocation: "us-east-1",
    reporters: ["list"],
    retries: 0,
  },
});

export default config;
