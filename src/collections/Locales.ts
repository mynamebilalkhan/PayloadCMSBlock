import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Locales: CollectionConfig = {
  slug: 'locales',
  admin: {
    useAsTitle: 'name',
    group: 'Site Settings',
    description: 'Available languages/regions for the site. Controls locale routing and RTL support.',
    defaultColumns: ['name', 'code', 'isDefault', 'isEnabled', 'sortOrder'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        // Normalize code to lowercase, URL-safe
        if (data.code) {
          data.code = data.code
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-|-$/g, '')
        }

        // Enforce single isDefault: if this locale is being set as default,
        // unset any other locale currently marked as default
        if (data.isDefault === true) {
          const existing = await req.payload.find({
            collection: 'locales',
            where: {
              isDefault: { equals: true },
              ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
            },
            limit: 10,
            req,
          })
          for (const doc of existing.docs) {
            await req.payload.update({
              collection: 'locales',
              id: doc.id,
              data: { isDefault: false },
              req,
            })
          }
        }

        return data
      },
    ],
    afterChange: [
      () => {
        // Invalidate the cached locale list so middleware + utilities pick up changes
        try {
          revalidateTag('locales')
        } catch {
          // revalidateTag only works in Next.js request context; safe to ignore otherwise
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Locale Name',
      admin: { description: 'e.g. "English", "Français", "العربية"' },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Locale Code',
      admin: {
        description: 'BCP-47 language code used as URL prefix, e.g. "en", "fr", "ar". Must be lowercase.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Locale code is required.'
        if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(value)) {
          return 'Code must be lowercase, e.g. "en", "fr", "zh-tw".'
        }
        return true
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: 'Default Locale',
      defaultValue: false,
      admin: {
        description: 'Only one locale can be the default. The site root (/) redirects here.',
      },
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      label: 'Enabled',
      defaultValue: true,
      admin: {
        description: 'Disabled locales are not accessible on the frontend (middleware returns 404).',
      },
    },
    {
      name: 'isRTL',
      type: 'checkbox',
      label: 'Right-to-Left (RTL)',
      defaultValue: false,
      admin: {
        description: 'When enabled, sets html dir="rtl" for this locale. Use for Arabic, Hebrew, etc.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
      admin: {
        description: 'Lower number appears first in locale lists. Use 0 for the default locale.',
      },
    },
    {
      name: 'flag',
      type: 'text',
      label: 'Flag / Icon',
      admin: {
        description: 'Optional emoji flag (e.g. 🇬🇧) or icon identifier shown in the admin UI.',
      },
    },
  ],
  timestamps: true,
}
