import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Site Settings',
    description: 'Global site footer — logo, link columns, social links, and copyright.',
  },
  fields: [
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
      admin: { description: 'e.g. "© 2025 Acme Inc. All rights reserved."' },
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
            { label: 'Twitter / X', value: 'twitter'   },
            { label: 'LinkedIn',    value: 'linkedin'  },
            { label: 'GitHub',      value: 'github'    },
            { label: 'YouTube',     value: 'youtube'   },
            { label: 'Instagram',   value: 'instagram' },
            { label: 'Facebook',    value: 'facebook'  },
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
}
