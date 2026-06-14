import { defineField, defineType } from "sanity";

/**
 * Top-level story document.
 * Contains the postcard image (grid + hero), cover image,
 * and an ordered array of pages.
 */
export const storyType = defineType({
  name: "story",
  title: "Story",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description: "URL path for this story. Auto-generated from the title.",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "orderRank",
      title: "Order",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "postcard",
      title: "Postcard Image",
      description:
        "Displayed in the story grid and above the fold on the landing page.",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt Text", type: "string" })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      description:
        "Full-screen image shown before the reader enters the story.",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt Text", type: "string" })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "pages",
      title: "Pages",
      description:
        "Add pages in reading order. Each page has panels and prose.",
      type: "array",
      of: [{ type: "storyPage" }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", media: "postcard" },
  },
});
