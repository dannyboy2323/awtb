#!/usr/bin/env node
/**
 * AI Docs Maintenance Script
 *
 * Reads recent git diff, compares against current /docs content,
 * asks Claude to suggest updates, and writes them back to disk.
 *
 * Run by the ai-docs.yml GitHub Action on every push to main.
 * Claude only updates docs when it detects a meaningful discrepancy —
 * it will not rewrite docs that are already accurate.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set");
  process.exit(1);
}

const DOCS = [
  {
    path: "docs/architecture.md",
    description:
      "Architecture overview, stack table, data flow, key directories",
  },
  {
    path: "docs/local-dev.md",
    description: "Local development guide, available URLs, key commands table",
  },
  {
    path: "docs/environment-setup.md",
    description: "Environment variable reference and setup instructions",
  },
  {
    path: "docs/testing.md",
    description: "Testing guide covering Vitest, Playwright, and Checkly",
  },
  {
    path: "docs/deployment.md",
    description:
      "Deployment guide covering Vercel, database migrations, rollbacks",
  },
];

/**
 * Get the git diff for files changed in the last commit,
 * excluding docs themselves to avoid feedback loops.
 */
function getDiff() {
  try {
    return execSync(
      "git diff HEAD~1 HEAD -- " +
        '":(exclude)docs/**" ' +
        '":(exclude)*.md" ' +
        '":(exclude)package-lock.json" ' +
        '":(exclude)sanity.types.ts" ' +
        '":(exclude)sanity.schema.json"',
      { encoding: "utf8", maxBuffer: 100 * 1024 },
    ).trim();
  } catch {
    try {
      return execSync('git diff HEAD -- ":(exclude)docs/**" ":(exclude)*.md"', {
        encoding: "utf8",
        maxBuffer: 100 * 1024,
      }).trim();
    } catch {
      return "";
    }
  }
}

/**
 * Get the list of files changed in the last commit.
 */
function getChangedFiles() {
  try {
    return execSync("git diff HEAD~1 HEAD --name-only", { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Read current doc content from disk.
 */
function readDoc(docPath) {
  const fullPath = join(process.cwd(), docPath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, "utf8");
}

/**
 * Call Claude API to review diff against a doc and suggest updates.
 */
async function reviewDoc(diff, changedFiles, doc, currentContent) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system:
        "You are a technical documentation maintainer for a Next.js + Sanity + Vercel project called AWTB.\n" +
        "Your job is to keep documentation accurate and up to date based on code changes.\n\n" +
        "Rules:\n" +
        "- Only update content that is factually incorrect or missing based on the diff\n" +
        "- Preserve the existing writing style, tone, and structure exactly\n" +
        "- Do not add marketing language or fluff\n" +
        "- Do not remove content unless it is clearly outdated by the diff\n" +
        "- If the doc is already accurate, return it unchanged\n" +
        "- Return ONLY the complete updated markdown file content — no preamble, no explanation, no code fences\n" +
        "- If no changes are needed, return the exact current content unchanged",
      messages: [
        {
          role: "user",
          content:
            "Here is a git diff of recent code changes (excluding docs):\n\n" +
            "<diff>\n" +
            diff.slice(0, 15000) +
            "\n</diff>\n\n" +
            "Changed files:\n" +
            changedFiles.join("\n") +
            "\n\nHere is the current content of " +
            doc.path +
            " (" +
            doc.description +
            "):\n\n" +
            "<current_doc>\n" +
            currentContent +
            "\n</current_doc>\n\n" +
            "Review the diff and update the doc if any information is now inaccurate or missing.\n" +
            "Return the complete updated markdown file content.",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error("Claude API error " + response.status + ": " + error);
  }

  const data = await response.json();
  return (
    (data.content[0] && data.content[0].text && data.content[0].text.trim()) ||
    currentContent
  );
}

async function main() {
  console.log("Getting git diff...");
  const diff = getDiff();
  const changedFiles = getChangedFiles();

  if (!diff) {
    console.log("No meaningful code changes detected. Skipping doc review.");
    process.exit(0);
  }

  console.log("Changed files:");
  console.log(changedFiles.join("\n"));
  console.log("\nAsking Claude to review " + DOCS.length + " docs...");

  let anyUpdated = false;

  for (const doc of DOCS) {
    const currentContent = readDoc(doc.path);
    if (!currentContent) {
      console.log("  SKIP " + doc.path + " not found");
      continue;
    }

    console.log("\n  Reviewing " + doc.path + "...");

    try {
      const updatedContent = await reviewDoc(
        diff,
        changedFiles,
        doc,
        currentContent,
      );

      if (updatedContent !== currentContent) {
        writeFileSync(join(process.cwd(), doc.path), updatedContent, "utf8");
        console.log("  UPDATED " + doc.path);
        anyUpdated = true;
      } else {
        console.log("  OK " + doc.path + " is already accurate");
      }
    } catch (err) {
      console.error("  ERROR reviewing " + doc.path + ": " + err.message);
    }

    // Rate limit: wait 1 second between API calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!anyUpdated) {
    console.log("\nAll docs are up to date — no changes needed.");
  } else {
    console.log("\nDocs updated. The workflow will open a PR for review.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
