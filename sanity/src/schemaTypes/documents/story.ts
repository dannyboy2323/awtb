import { defineField, defineType } from 'sanity'

/**
 * Top-level story document.
 * Contains the postcard image (grid + hero), cover images (square for
 * landscape, portrait for mobile), and an ordered array of pages.
 */
export const storyType = defineType({
  name: 'story',
  title: 'Story',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL path for this story. Auto-generated from the title.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Order',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'postcard',
      title: 'Postcard Image',
      description: 'Displayed in the story grid and above the fold on the landing page.',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image (Square — Landscape / Desktop)',
      description:
        'Square (1:1) image used as the cover on landscape / desktop layouts. Fills the left half of the journal spread.',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImagePortrait',
      title: 'Cover Image Portrait (9:16 — Mobile)',
      description:
        'Tall portrait (9:16) image used as the cover on mobile / portrait layouts. Falls back to coverImage if not provided.',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({
      name: 'pages',
      title: 'Pages',
      description: 'Add pages in reading order. Each page has panels and prose.',
      type: 'array',
      of: [{ type: 'storyPage' }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'title', media: 'postcard' },
  },
})
