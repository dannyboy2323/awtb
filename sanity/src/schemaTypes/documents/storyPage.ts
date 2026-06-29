import { defineField, defineType } from 'sanity'

/**
 * A single page within a story.
 *
 * Prose is a rich Portable Text field that supports both standard text blocks
 * and inline panel images (panelImage type). Insert images directly in the
 * editor at any position, with left/right/center/full alignment — exactly
 * like a Word document or magazine article layout.
 *
 * The separate panels[] field has been removed. All imagery lives inline
 * within prose for a WYSIWYG authoring experience.
 */
export const storyPageType = defineType({
  name: 'storyPage',
  title: 'Story Page',
  type: 'object',
  fields: [
    defineField({
      name: 'prose',
      title: 'Story Text & Images',
      description:
        'Write your story text here. Use the image toolbar button to insert graphic novel panels inline — float them left or right to wrap text around them, just like a magazine layout.',
      type: 'array',
      of: [
        // Standard rich text blocks
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading', value: 'h2' },
            { title: 'Subheading', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
          },
        },
        // Inline panel image blocks — inserted via toolbar
        { type: 'panelImage' },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      prose: 'prose',
    },
    prepare({ prose }) {
      // Show first text block as preview title
      const firstBlock = Array.isArray(prose)
        ? prose.find((b: { _type: string }) => b._type === 'block')
        : null
      const text =
        firstBlock?.children
          ?.filter((c: { _type: string }) => c._type === 'span')
          ?.map((c: { text: string }) => c.text)
          ?.join('') ?? 'Page'
      return { title: text.slice(0, 60) }
    },
  },
})
