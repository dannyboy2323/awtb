import { defineField, defineType } from 'sanity'
import { ImageIcon } from '@sanity/icons'

/**
 * Inline panel image block for use within storyPage prose (Portable Text).
 *
 * Inserted directly in the WYSIWYG editor — behaves like an image in a Word
 * document or blog post. Supports left/right/center/full alignment so panels
 * can float alongside prose text.
 *
 * The image is always 1:1 (square) — enforced by the panel generation pipeline.
 * Clicking the rendered image in the reader opens a lightbox at full resolution.
 */
export const panelImageType = defineType({
  name: 'panelImage',
  title: 'Panel Image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Describe the image for screen readers.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption shown below the image.',
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      description: 'How the image sits relative to the surrounding text.',
      options: {
        list: [
          { title: 'Float Left (text wraps right)', value: 'left' },
          { title: 'Float Right (text wraps left)', value: 'right' },
          { title: 'Center (no text wrap)', value: 'center' },
          { title: 'Full Width', value: 'full' },
        ],
        layout: 'radio',
      },
      initialValue: 'left',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'alt',
      subtitle: 'alignment',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ?? 'Panel Image',
        subtitle: subtitle ? `Alignment: ${subtitle}` : '',
        media,
      }
    },
  },
})
