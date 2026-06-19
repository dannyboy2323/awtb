import { defineField, defineType } from 'sanity'

/**
 * A single graphic-novel panel image within a story page.
 * Panels are ordered within a page — editors drag to reorder.
 */
export const panelType = defineType({
  name: 'panel',
  title: 'Panel',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Panel Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption (optional)',
      type: 'string',
    }),
  ],
  preview: {
    select: { media: 'image', title: 'alt' },
  },
})
