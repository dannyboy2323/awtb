/**
 * One-time script to upload all desk background images to Vercel Blob.
 * Run from the project root:
 *   BLOB_READ_WRITE_TOKEN=$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'=' -f2 | tr -d '"') node scripts/upload-desk-images.mjs
 *
 * Outputs: public/desk-image-urls.json
 */

import { put } from "@vercel/blob";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Error: BLOB_READ_WRITE_TOKEN is not set.");
  console.error("Run with:");
  console.error(
    "  BLOB_READ_WRITE_TOKEN=$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'=' -f2 | tr -d '\"') node scripts/upload-desk-images.mjs",
  );
  process.exit(1);
}

const SOURCE_DIR =
  "/Users/dannyboice/Developer/awtb-frontend/public/assets/landing";
const OUTPUT_FILE = "./public/desk-image-urls.json";

async function upload() {
  const files = readdirSync(SOURCE_DIR).filter(
    (f) => f.endsWith(".jpg") || f.endsWith(".jpeg"),
  );

  console.log(`Found ${files.length} images to upload...`);

  const urls = {};

  for (const file of files) {
    const filePath = join(SOURCE_DIR, file);
    const buffer = readFileSync(filePath);
    const contentType = file.endsWith(".jpeg") ? "image/jpeg" : "image/jpeg";

    console.log(`Uploading ${file}...`);

    const blob = await put(`desk/${file}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    urls[basename(file, file.includes(".jpeg") ? ".jpeg" : ".jpg")] = blob.url;
    console.log(`  ✓ ${blob.url}`);
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(urls, null, 2));
  console.log(`\nDone! URLs written to ${OUTPUT_FILE}`);
  console.log(`Total: ${Object.keys(urls).length} images uploaded`);
}

upload().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
