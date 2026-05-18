/**
 * Server-safe block schemas for Nextbridge home blocks.
 * Keep schemas out of 'use client' component files so API routes / seed can import them.
 */

export const homeBannerSchema = {
  fields: [
    { name: 'title', type: 'text', label: 'Title', required: true },
    { name: 'founded', type: 'text', label: 'Founded' },
    { name: 'engagement', type: 'text', label: 'Engagement' },
  ],
}

export const homeVideoSchema = {
  fields: [
    { name: 'src', type: 'text', label: 'Video URL', required: true },
  ],
}

export const homeStorySchema = {
  fields: [
    { name: 'lead', type: 'text', label: 'Lead line' },
    { name: 'leadBold', type: 'text', label: 'Lead bold line' },
    {
      name: 'paragraphs',
      type: 'array',
      label: 'Paragraphs',
      fields: [
        { name: 'text', type: 'textarea', label: 'Text', required: true },
        { name: 'emphasis', type: 'checkbox', label: 'Emphasis style' },
      ],
    },
    { name: 'closing', type: 'textarea', label: 'Closing paragraph' },
  ],
}

export const homeDoorsSchema = {
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Door cards',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', label: 'Title', required: true },
        { name: 'body', type: 'textarea', label: 'Body', required: true },
        { name: 'link', type: 'text', label: 'Link label', required: true },
        { name: 'href', type: 'text', label: 'URL', required: true },
      ],
    },
  ],
}

export const homeVoicesSchema = {
  fields: [
    { name: 'heading', type: 'text', label: 'Section heading' },
    {
      name: 'items',
      type: 'array',
      label: 'Testimonials',
      minRows: 1,
      fields: [
        { name: 'quote', type: 'textarea', label: 'Quote', required: true },
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'company', type: 'text', label: 'Company', required: true },
      ],
    },
  ],
}

export const homeCtaSchema = {
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'label', type: 'text', label: 'Button label', required: true },
    { name: 'href', type: 'text', label: 'Button URL', required: true },
  ],
}
