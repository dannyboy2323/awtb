/**
 * One-time script to upload story background images to Vercel Blob.
 * Run from the project root:
 *   BLOB_READ_WRITE_TOKEN=$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'=' -f2 | tr -d '"') node scripts/upload-story-bg.mjs
 *
 * Outputs: public/story-bg-urls.json
 *
 * Images uploaded:
 *   bg-story-16_9.webp  — landscape journal spread (used in story reader)
 *   bg-story-9_16.webp  — portrait single page (used in mobile/responsive view)
 */

import { put } from "@vercel/blob";
import { readFileSync, writeFileSync } from "fs";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Error: BLOB_READ_WRITE_TOKEN is not set.");
  console.error("Run with:");
  console.error(
    "  BLOB_READ_WRITE_TOKEN=$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'=' -f2 | tr -d '\"') node scripts/upload-story-bg.mjs",
  );
  process.exit(1);
}

const OUTPUT_FILE = "./public/story-bg-urls.json";

const FILES = [
  {
    localPath: "public/images/bg-story-16_9.webp",
    blobPath: "story/bg-story-16_9.webp",
    key: "landscape",
    contentType: "image/webp",
  },
  {
    localPath: "public/images/bg-story-9_16.webp",
    blobPath: "story/bg-story-9_16.webp",
    key: "portrait",
    contentType: "image/webp",
  },
];

async function upload() {
  console.log(
    `Uploading ${FILES.length} story background images to Vercel Blob...`,
  );
  console.log("");

  const urls = {};

  for (const file of FILES) {
    const buffer = readFileSync(file.localPath);

    console.log(`Uploading ${file.localPath}...`);

    const blob = await put(file.blobPath, buffer, {
      access: "public",
      contentType: file.contentType,
      addRandomSuffix: false,
    });

    urls[file.key] = blob.url;
    console.log(`  ✓ ${blob.url}`);
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(urls, null, 2));
  console.log("");
  console.log(`Done! URLs written to ${OUTPUT_FILE}`);
  console.log(`Total: ${Object.keys(urls).length} images uploaded`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Commit public/story-bg-urls.json");
  console.log("  2. Delete public/images/bg-story-*.webp from the repo");
  console.log(
    "  3. Reference URLs via import from public/story-bg-urls.json in story-reader.css or lib/story-assets.ts",
  );
}

upload().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
