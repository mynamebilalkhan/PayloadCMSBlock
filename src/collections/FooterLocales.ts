import type { CollectionConfig } from 'payload'

export const FooterLocales: CollectionConfig = {
  slug: 'footer-locales',
  admin: {
    useAsTitle: 'locale',
    group: 'Site Settings',
    description: 'Per-locale footer configuration — logo, link columns, social links, and copyright.',
    defaultColumns: ['locale', 'copyright', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'locale',
      type: 'relationship',
      relationTo: 'locales',
      required: true,
      unique: true,
      label: 'Locale',
      admin: {
        description: 'Which locale this footer configuration applies to. One footer per locale.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Footer Columns',
      admin: {
        description: 'Link groups displayed in columns across the footer.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Column Title',
        },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'Label',
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              label: 'URL',
            },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'Copyright Text',
      admin: {
        description: 'e.g. "© 2025 Acme Inc. All rights reserved."',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Links',
      fields: [
        {
          name: 'platform',
          type: 'select',
          label: 'Platform',
          options: [
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
        },
      ],
    },
  ],
  timestamps: true,
}
