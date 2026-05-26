import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { SELECT_OPTIONS } from '@/lib/localesList'
import { applyPresetToData } from '@/lib/locale/applyPreset'
import { duplicateAllPagesOnLocaleSave } from '@/lib/admin/duplicateAllPagesOnLocaleSave'

export const Locales: CollectionConfig = {
  slug: 'locales',
  admin: {
    useAsTitle: 'name',
    group: 'Site Settings',
    description:
      'Available languages/regions for the site. Saving a new enabled locale copies all pages from the default locale as drafts.',
    defaultColumns: ['name', 'code', 'isDefault', 'isEnabled', 'sortOrder'],
    components: {
      edit: {
        SaveButton: '@/components/admin/LocaleSaveButton#LocaleSaveButton',
      },
    },
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      async ({ data }) => {
        applyPresetToData(data)

        // Normalize code to lowercase, URL-safe before validation.
        if (data.code) {
          data.code = data.code
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-|-$/g, '')
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        applyPresetToData(data)

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
      duplicateAllPagesOnLocaleSave,
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
      name: 'preset',
      type: 'select',
      label: 'Choose a preset locale',
      admin: {
        description:
          'Pick from common locales for convenience. Choose "Other (custom)" to enter a custom code.',
        components: {
          Field: '@/components/admin/LocalePresetField#LocalePresetField',
        },
      },
      options: SELECT_OPTIONS,
      validate: (value: string | null | undefined) => {
        if (!value) return 'Please select a preset locale.'
        return true
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Locale Name',
      admin: {
        description: 'e.g. "English", "Français", "العربية"',
        condition: (_, siblingData) => siblingData?.preset === 'custom',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Locale Code',
      admin: {
        description: 'BCP-47 language code used as URL prefix, e.g. "en", "fr", "ar". Must be lowercase.',
        condition: (_, siblingData) => siblingData?.preset === 'custom',
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
      type: "row",
      fields: [
        {
          name: 'isDefault',
          type: 'checkbox',
          label: 'Default Locale',
          defaultValue: false,
          admin: {
            width: '33%',
            description: 'Only one locale can be the default. The site root (/) redirects here.',
          },
        },
        {
          name: 'isEnabled',
          type: 'checkbox',
          label: 'Enabled',
          defaultValue: true,
          admin: {
            width: '33%',
            description: 'Disabled locales are not accessible on the frontend (middleware returns 404).',
          },
        },
        {
          name: 'isRTL',
          type: 'checkbox',
          label: 'Right-to-Left (RTL)',
          defaultValue: false,
          admin: {
            width: '34%',
            description:
              'Auto-set from the selected preset locale. Editable only when "Other (custom)" is selected.',
            components: {
              Field: '@/components/admin/LocaleRTLField#LocaleRTLField',
            },
          },
        },
      ]
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
      name: 'duplicatePagesFromDefault',
      type: 'checkbox',
      label: 'Copy pages from default locale on save',
      defaultValue: true,
      admin: {
        description:
          'When enabled, saving this locale creates draft copies of every default-locale page (same layout, placeholder titles). Uncheck to add the locale without copying pages.',
        condition: (_, siblingData) => siblingData?.isDefault !== true,
      },
    },
  ],
  timestamps: true,
}
