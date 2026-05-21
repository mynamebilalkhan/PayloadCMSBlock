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
      name: 'navigation',
      type: 'array',
      label: 'Navigation Links',
      admin: {
        description: 'Flat list of footer navigation links (0 depth).',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Link Label',
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'URL',
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
