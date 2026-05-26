import type { CollectionConfig } from 'payload'
import { randomUUID } from 'crypto'

import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'
import { normalizeBlockData } from '@/lib/blockData/normalizeBlockData'
import { slugBeforeValidate } from '@/lib/payload/slug'
import { ensureDbLayoutInstanceIds } from '@/lib/admin/ensureDbLayoutInstanceIds'
import { propagatePageToEnabledLocalesAfterCreate } from '@/lib/admin/propagatePageToEnabledLocales'
import { syncStructureToLocaleSiblingsAfterChange } from '@/lib/admin/syncStructureToLocaleSiblings'
import { Testimonials } from '@/blocks/Generic/Testimonials/config'

// import { OverviewField } from "@/fields/OverviewField";
// import { MetaTitleField } from "@/fields/MetaTitleField";
// import { MetaImageField } from "@/fields/MetaImageField";
// import { MetaDescriptionField } from "@/fields/MetaDescriptionField";
// import { PreviewField } from "@/fields/PreviewField";

/**
 * pages: stores page content as a dynamic array of block instances.
 *
 * Each layout entry references:
 *   - blockDefinition: which block type
 *   - blockVersion:    which schema version was in use when this instance was created
 *   - data:            the actual field values (validated client-side against the schema)
 *
 * Backward compatibility: pages pin to a specific blockVersion, so schema updates
 * never break existing content — old pages continue rendering with the version they
 * were authored against.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Site pages composed from dynamic block instances.',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    components: {
      views: {
        list: {
          Component: '@/components/admin/PagesGroupedList#PagesGroupedList',
        },
      },
    },
    preview: (doc) => {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
      const localeCode = (doc?.locale as { code?: string } | null)?.code ?? 'en'
      const slug = (doc?.slug as string) ?? '/'
      const path = slug === '/' ? '' : `/${slug}`
      return `${serverUrl}/${localeCode}${path}`
    },
  },
  access: {
    read: ({ req }) => {
      // Published pages are public; drafts require auth
      if (req.user) return true
      return { status: { equals: 'published' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [
      slugBeforeValidate('title', true),
    ],
    beforeChange: [
      ({ data, operation, req, originalDoc }) => {
        if (data.locale != null && data.locale !== '') {
          data.locale = coerceRelationshipId(data.locale as string | number)
        }
        // Auto-generate translationGroupId on create (not on update)
        if (!data.translationGroupId) {
          data.translationGroupId = randomUUID()
        }
        if (operation === 'create' && data.createLocaleOnSave != null) {
          req.context = req.context ?? {}
          req.context.pendingCreateLocaleOnSave = data.createLocaleOnSave
        }
        if (operation === 'update') {
          delete data.createTranslationsForAllLocales
          delete data.createLocaleOnSave
        }
        if (Array.isArray(data.dbLayout)) {
          data.dbLayout = ensureDbLayoutInstanceIds(
            data.dbLayout,
            originalDoc?.dbLayout,
          ) as typeof data.dbLayout
          for (const row of data.dbLayout) {
            if (row && typeof row === 'object' && 'data' in row) {
              const layoutRow = row as { data?: unknown }
              layoutRow.data = normalizeBlockData(layoutRow.data)
            }
          }
        }
        return data
      },
    ],
    afterChange: [
      propagatePageToEnabledLocalesAfterCreate,
      syncStructureToLocaleSiblingsAfterChange,
    ],
  },
  fields: [
    // ─── Sidebar ───────────────────────────────────────────────────────────
    {
      name: 'slug',
      type: 'text',
      required: true,
      label: 'Slug',
      admin: {
        description: 'URL path, e.g. "about-us". Use "/" for the homepage. Auto-syncs from title until you unlock. Must be unique per locale.',
        position: 'sidebar',
        components: {
          Field: '@/components/admin/SlugField#SlugField',
        },
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Slug is required.'
        if (!/^[a-z0-9/-]+$/.test(value)) return 'Slug must be lowercase with hyphens or slashes.'
        return true
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      label: 'Status',
      admin: {
        position: 'sidebar',
      },
    },
    // ─── Locale & Translation ──────────────────────────────────────────────────
    {
      name: 'locale',
      type: 'relationship',
      relationTo: 'locales',
      required: true,
      label: 'Locale',
      admin: {
        description: 'Switch language to open that translation. Each locale is a separate page document.',
        position: 'sidebar',
        components: {
          Field: '@/components/admin/PageLocaleField#PageLocaleField',
        },
      },
    },
    {
      name: 'createLocaleOnSave',
      type: 'json',
      label: 'Create translations',
      admin: {
        position: 'sidebar',
        description:
          'When saving a new page, optionally create draft copies in other languages.',
        components: {
          Field: '@/components/admin/CreateLocaleVariantsField#CreateLocaleVariantsField',
        },
      },
    },
    {
      name: 'autoSyncStructureToLocales',
      type: 'checkbox',
      label: 'Auto-sync structure to locales',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Default locale only. When on, other locale pages mirror this page’s block layout; their translated content is preserved.',
        components: {
          Field: '@/components/admin/AutoSyncStructureField#AutoSyncStructureField',
        },
      },
    },
    {
      name: 'translationGroupId',
      type: 'text',
      label: 'Translation Group ID',
      admin: {
        hidden: true,
        readOnly: true,
        description: 'Internal UUID linking locale variants. Auto-generated on create.',
      },
    },
    {
      name: 'translationStatus',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/TranslationStatus#TranslationStatus',
        },
      },
    },
    {
      name: 'duplicateForLocale',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/DuplicateForLocale#DuplicateForLocale',
        },
      },
    },
    {
      name: 'translationReference',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/TranslationReferencePanel#TranslationReferencePanel',
        },
      },
    },
    // ─── Main editor tabs ────────────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          description: 'Page title and SEO metadata.',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: 'Page Title',
            },
            {
              name: 'seo',
              type: 'group',
              label: 'SEO',
              fields: [
                {
                  name: 'metaTitle',
                  type: 'text',
                  label: 'Meta Title',
                },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  label: 'Meta Description',
                },
                {
                  name: 'ogImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'OG Image',
                },
                {
                  name: 'noIndex',
                  type: 'checkbox',
                  label: 'No Index',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        {
          label: 'Content',
          description:
            'Add the sections visitors see on this page (hero, features, testimonials, and more).',
          fields: [
            {
              name: 'dbLayout',
              type: 'array',
              label: 'Page sections',
              labels: {
                singular: 'Section',
                plural: 'Sections',
              },
              admin: {
                description:
                  'Main page content. Click “Add Section”, choose a section type (e.g. Hero Banner, Card Grid), then fill in the fields. Drag rows to reorder.',
              },
              fields: [
                {
                  name: 'blockDefinition',
                  type: 'relationship',
                  relationTo: 'block-definitions',
                  required: true,
                  label: 'Section type',
                  admin: {
                    description:
                      'What kind of section this is. Thumbnails come from each block’s Thumbnail in Block System.',
                    components: {
                      Field:
                        '@/components/admin/BlockDefinitionPickerField#BlockDefinitionPickerField',
                    },
                  },
                  filterOptions: {
                    isDeprecated: { not_equals: true },
                  },
                },
                {
                  name: 'blockVersion',
                  type: 'relationship',
                  relationTo: 'block-definition-versions',
                  required: true,
                  label: 'Section version',
                  admin: {
                    hidden: true,
                    description:
                      'Auto-set when you pick a section type. Pins schema compatibility for this row.',
                    condition: (_, siblingData) => Boolean(siblingData?.blockDefinition),
                  },
                  filterOptions: ({ siblingData }) => {
                    const data = siblingData as Record<string, unknown> | undefined
                    if (!data?.blockDefinition) return false
                    return { blockDefinition: { equals: data.blockDefinition } }
                  },
                },
                {
                  name: 'instanceId',
                  type: 'text',
                  label: 'Section ID',
                  admin: {
                    hidden: true,
                    readOnly: true,
                  },
                },
                {
                  name: 'label',
                  type: 'text',
                  label: 'Section label',
                  admin: {
                    description: 'Optional name for editors only (e.g. “Homepage hero”). Not shown on the website.',
                  },
                },
                {
                  name: 'data',
                  type: 'json',
                  required: true,
                  label: 'Section content',
                  admin: {
                    description: 'Headlines, images, buttons, and other fields for this section.',
                    components: {
                      Field: '@/components/BlockDataField#BlockDataField',
                    },
                  },
                },
                {
                  name: 'hidden',
                  type: 'checkbox',
                  label: 'Hide on website',
                  defaultValue: false,
                  admin: {
                    description: 'Turn on to hide this section from visitors without deleting it.',
                  },
                },
                {
                  name: 'anchor',
                  type: 'text',
                  label: 'Link anchor',
                  admin: {
                    description:
                      'Optional ID for in-page links, e.g. "pricing" → yoursite.com/page#pricing',
                  },
                },
              ],
            },
            {
              name: 'contentBlocks',
              type: 'blocks',
              label: 'Ready-made blocks',
              labels: {
                singular: 'Block',
                plural: 'Blocks',
              },
              blocks: [Testimonials],
              admin: {
                initCollapsed: true,
                description:
                  'Pre-built blocks with fixed layouts (e.g. testimonials today; more types coming). For flexible sections—hero, grids, FAQ—use Page sections above.',
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
