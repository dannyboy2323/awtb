import { defineField, defineType } from "sanity";

/**
 * A single page within a story.
 * Left column: panels (graphic novel images, ordered).
 * Right column: prose (Portable Text rich text).
 */
export const storyPageType = defineType({
  name: "storyPage",
  title: "Story Page",
  type: "object",
  fields: [
    defineField({
      name: "panels",
      title: "Graphic Novel Panels",
      description: "Upload panel images. Drag to reorder.",
      type: "array",
      of: [{ type: "panel" }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "prose",
      title: "Story Text",
      description: "Type or paste the prose for this page.",
      type: "array",
      of: [{ type: "block" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { media: "panels.0.image", title: "panels.0.alt" },
    prepare({ media, title }) {
      return { title: title ?? "Page", media };
    },
  },
});
