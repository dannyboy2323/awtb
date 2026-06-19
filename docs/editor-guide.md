# Editor Guide

## Accessing the Studio

The Sanity Studio is embedded directly in the app — no separate login portal.

- **Production:** https://awtb.vercel.app/studio
- **Local:** http://localhost:3000/studio

Log in with your Sanity account credentials.

## Content Types

### Story

The main content type. Each story has:

- **Title** — display name
- **Slug** — URL-friendly identifier (auto-generated from title)
- **Published At** — controls when the story appears publicly
- **Postcard Image** — the image shown on the landing page grid
- **Cover Image** — full-screen image shown on the story cover page
- **Pages** — ordered array of story pages

### Story Page

Each page within a story contains:

- **Panels** — ordered array of graphic novel panel images (drag to reorder)
- **Prose** — rich text displayed alongside the panels

### Panel

A single graphic novel image with:

- **Image** — the panel artwork
- **Alt text** — required for accessibility
- **Caption** — optional caption shown below the panel

### Site Settings

Global settings (singleton document):

- **Featured Story** — which story appears above the fold on the landing page
- **Desk Background Image** — the background image for the landing hero

## Publishing Workflow

1. Create or edit a document in the Studio
2. Click **Publish** (green button, top right)
3. The site updates automatically within a few seconds — no redeploy needed

## Changing the Featured Story

1. Open **Site Settings** in the Studio sidebar
2. Click the **Featured Story** field and select a story
3. Click **Publish**
4. Update the `featuredStorySlug` value in Vercel Edge Config to match
   the new story's slug (vercel.com → Storage → Edge Config → Items)
