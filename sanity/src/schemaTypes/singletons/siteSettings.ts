import { defineField, defineType } from "sanity";

/**
 * Global site settings singleton.
 * Controls the featured story above the fold and the desk background image.
 */
export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "featuredStory",
      title: "Featured Story",
      description: "This story appears above the fold on the landing page.",
      type: "reference",
      to: [{ type: "story" }],
    }),
    defineField({
      name: "deskBackgroundImage",
      title: "Desk Background Image",
      description:
        "The photorealistic desk texture used as the landing page background.",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
