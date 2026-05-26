import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import {
  CUSTOM_FONT_SIZE,
  isValidCssFontSize,
  withCustomSizeOption,
} from '@/theme/fontSize'

// ─── Google Fonts catalogue ───────────────────────────────────────────────────
// Value = exact Google Fonts family name (used verbatim in the API URL).

const FONT_OPTIONS = [
  // ── Sans-serif ───────────────────────────────────────────────────────────
  { label: 'Inter',                value: 'Inter'             },
  { label: 'Geist',                value: 'Geist'             },
  { label: 'Roboto',               value: 'Roboto'            },
  { label: 'Open Sans',            value: 'Open Sans'         },
  { label: 'Lato',                 value: 'Lato'              },
  { label: 'Poppins',              value: 'Poppins'           },
  { label: 'Montserrat',           value: 'Montserrat'        },
  { label: 'Nunito',               value: 'Nunito'            },
  { label: 'DM Sans',              value: 'DM Sans'           },
  { label: 'Michroma',             value: 'Michroma'          },
  { label: 'Plus Jakarta Sans',    value: 'Plus Jakarta Sans' },
  { label: 'Outfit',               value: 'Outfit'            },
  { label: 'Sora',                 value: 'Sora'              },
  { label: 'Space Grotesk',        value: 'Space Grotesk'     },
  { label: 'Raleway',              value: 'Raleway'           },
  { label: 'Source Sans 3',        value: 'Source Sans 3'     },
  // ── Serif ────────────────────────────────────────────────────────────────
  { label: 'Playfair Display',     value: 'Playfair Display'   },
  { label: 'Merriweather',         value: 'Merriweather'       },
  { label: 'Lora',                 value: 'Lora'               },
  { label: 'EB Garamond',          value: 'EB Garamond'        },
  { label: 'Libre Baskerville',    value: 'Libre Baskerville'  },
  { label: 'Crimson Pro',          value: 'Crimson Pro'        },
  { label: 'Cormorant Garamond',   value: 'Cormorant Garamond' },
  { label: 'DM Serif Display',     value: 'DM Serif Display'   },
  { label: 'Fraunces',             value: 'Fraunces'           },
  // ── Monospace ────────────────────────────────────────────────────────────
  { label: 'JetBrains Mono',       value: 'JetBrains Mono'    },
  { label: 'Fira Code',            value: 'Fira Code'         },
  { label: 'Source Code Pro',      value: 'Source Code Pro'   },
]

const WEIGHT_OPTIONS = [
  { label: 'Thin (100)',        value: '100' },
  { label: 'Extra Light (200)', value: '200' },
  { label: 'Light (300)',       value: '300' },
  { label: 'Regular (400)',     value: '400' },
  { label: 'Medium (500)',      value: '500' },
  { label: 'Semi Bold (600)',   value: '600' },
  { label: 'Bold (700)',        value: '700' },
  { label: 'Extra Bold (800)', value: '800' },
  { label: 'Black (900)',       value: '900' },
]

function customSizeTextField() {
  return {
    name: 'sizeCustom',
    type: 'text' as const,
    label: 'Custom Font Size',
    admin: {
      width: '100%',
      placeholder: 'e.g. 2.75rem, 44px, clamp(1rem, 2vw, 1.5rem)',
      description: 'Any valid CSS length (px, rem, em, %, clamp, inherit).',
      condition: (_: unknown, siblingData: Record<string, unknown>) =>
        siblingData?.size === CUSTOM_FONT_SIZE,
    },
    validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
      if (siblingData?.size !== CUSTOM_FONT_SIZE) return true
      const v = typeof value === 'string' ? value.trim() : ''
      if (!v) return 'Enter a custom font size (e.g. 2.75rem or 44px).'
      if (!isValidCssFontSize(v)) {
        return 'Use a valid CSS size: px, rem, em, %, inherit, or clamp(...).'
      }
      return true
    },
  }
}

// Produces a collapsible group box for one HTML tag containing font / size / weight
function tagTypographyGroup(
  tag: string,
  label: string,
  defaults: { font: string; size: string; weight: string },
  sizeOptions: { label: string; value: string }[],
) {
  return {
    name: tag,
    type: 'group' as const,
    label,
    fields: [
      {
        type: 'row' as const,
        fields: [
          {
            name: 'font',
            type: 'select' as const,
            label: 'Font Family',
            options: FONT_OPTIONS,
            defaultValue: defaults.font,
            admin: { width: '33.33%' },
          },
          {
            name: 'size',
            type: 'select' as const,
            label: 'Font Size',
            options: withCustomSizeOption(sizeOptions),
            defaultValue: defaults.size,
            admin: { width: '33.33%' },
          },
          {
            name: 'weight',
            type: 'select' as const,
            label: 'Font Weight',
            options: WEIGHT_OPTIONS,
            defaultValue: defaults.weight,
            admin: { width: '33.33%' },
          },
        ],
      },
      customSizeTextField(),
    ],
  }
}

const COLOR_FIELD_COMPONENT = '@/components/admin/ColorPickerField#ColorPickerField'

function themeColorField(
  name: string,
  label: string,
  defaultValue: string,
  description: string,
) {
  return {
    name,
    type: 'text' as const,
    label,
    defaultValue,
    admin: {
      width: '20%',
      description,
      components: {
        Field: COLOR_FIELD_COMPONENT,
      },
    },
  }
}

export const Theme: GlobalConfig = {
  slug: 'theme',
  label: 'Global Styles',
  admin: {
    group: 'Site Settings',
    description:
      'Site-wide colors, type, and spacing. Changes apply to all pages using nb-* styles on the frontend.',
  },
  hooks: {
    afterChange: [
      () => {
        revalidateTag('locale-globals')
      },
    ],
  },
  fields: [
    // ─── Colors ─────────────────────────────────────────────────────────────
    {
      name: 'colors',
      type: 'group',
      label: 'Colors',
      fields: [
        {
          type: 'row',
          fields: [
            themeColorField(
              'background',
              'Page Background',
              '#fafaf8',
              'Main page background (nb-bg).',
            ),
            themeColorField(
              'text',
              'Body Text',
              '#1a1a18',
              'Primary text color (nb-text).',
            ),
            themeColorField(
              'mutedText',
              'Muted Text',
              '#6b6b63',
              'Secondary copy (nb-text-secondary).',
            ),
            themeColorField(
              'divider',
              'Dividers & Borders',
              '#e0ded8',
              'Borders and rules (nb-divider).',
            ),
            themeColorField(
              'highlight',
              'Brand Highlight',
              '#c8a96e',
              'Gold accent, hovers, links (nb-highlight).',
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            themeColorField(
              'photoBg',
              'Photo Placeholder',
              '#e8e6e0',
              'Image placeholder areas (nb-photo-bg).',
            ),
            themeColorField(
              'dark',
              'Dark Section BG',
              '#1a1a18',
              'Inverted section background (nb-dark).',
            ),
            themeColorField(
              'darkText',
              'Text on Dark',
              '#fafaf8',
              'Headings/body on dark sections.',
            ),
            themeColorField(
              'darkMuted',
              'Muted on Dark',
              '#a8a89e',
              'Secondary text on dark sections.',
            ),
            themeColorField(
              'primary',
              'CTA / Button Fill',
              '#1a1a18',
              'Primary buttons (e.g. solid CTAs).',
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            themeColorField(
              'secondary',
              'CTA Hover',
              '#c8a96e',
              'Button hover / secondary accent.',
            ),
            themeColorField(
              'accent',
              'Accent',
              '#c8a96e',
              'Decorative accent (same as highlight).',
            ),
            themeColorField(
              'surface',
              'Card Surface',
              '#f9fafb',
              'Optional light panels (legacy surface).',
            ),
          ],
        },
      ],
    },

    // ─── Typography ──────────────────────────────────────────────────────────
    {
      name: 'typography',
      type: 'group',
      label: 'Typography',
      admin: {
        description: 'Pick a Google Font, size, and weight for each HTML heading level, body text, and links.',
      },
      fields: [
        // Base settings
        {
          type: 'row',
          fields: [
            {
              name: 'baseFontSize',
              type: 'select',
              label: 'Root Font Size (html)',
              options: withCustomSizeOption([
                { label: '14 px', value: '14px' },
                { label: '15 px', value: '15px' },
                { label: '16 px (browser default)', value: '16px' },
                { label: '17 px', value: '17px' },
                { label: '18 px', value: '18px' },
              ]),
              defaultValue: '16px',
              admin: { width: '50%', description: 'Sets 1 rem scale for the site.' },
            },
            {
              name: 'lineHeight',
              type: 'select',
              label: 'Default Line Height',
              options: [
                { label: 'Tight — 1.3', value: '1.3' },
                { label: 'Snug — 1.4', value: '1.4' },
                { label: 'Normal — 1.5', value: '1.5' },
                { label: 'Relaxed — 1.6', value: '1.6' },
                { label: 'Loose — 1.8', value: '1.8' },
              ],
              defaultValue: '1.6',
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'baseFontSizeCustom',
              type: 'text',
              label: 'Custom Root Font Size',
              admin: {
                width: '100%',
                placeholder: 'e.g. 15px or 1.0625rem',
                condition: (_: unknown, siblingData: Record<string, unknown>) =>
                  siblingData?.baseFontSize === CUSTOM_FONT_SIZE,
              },
              validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
                if (siblingData?.baseFontSize !== CUSTOM_FONT_SIZE) return true
                const v = typeof value === 'string' ? value.trim() : ''
                if (!v) return 'Enter a custom root font size.'
                if (!isValidCssFontSize(v)) return 'Use a valid CSS size (px, rem, em, %).'
                return true
              },
            },
          ],
        },

        // ── Per-tag groups ───────────────────────────────────────────────────
        tagTypographyGroup('h1', 'H1 — Hero / Page Title', { font: 'Michroma', size: '3.5rem', weight: '400' }, [
          { label: '2.5 rem (40 px)', value: '2.5rem' },
          { label: '3 rem (48 px)',   value: '3rem'   },
          { label: '3.5 rem (56 px)', value: '3.5rem' },
          { label: '4 rem (64 px)',   value: '4rem'   },
          { label: '4.5 rem (72 px)', value: '4.5rem' },
          { label: '5 rem (80 px)',   value: '5rem'   },
        ]),

        tagTypographyGroup('h2', 'H2 — Section Title', { font: 'Michroma', size: '2.25rem', weight: '400' }, [
          { label: '1.75 rem (28 px)', value: '1.75rem' },
          { label: '2 rem (32 px)',    value: '2rem'    },
          { label: '2.25 rem (36 px)', value: '2.25rem' },
          { label: '2.5 rem (40 px)',  value: '2.5rem'  },
          { label: '3 rem (48 px)',    value: '3rem'    },
        ]),

        tagTypographyGroup('h3', 'H3 — Sub-section Title', { font: 'Michroma', size: '1.75rem', weight: '400' }, [
          { label: '1.25 rem (20 px)', value: '1.25rem' },
          { label: '1.5 rem (24 px)',  value: '1.5rem'  },
          { label: '1.75 rem (28 px)', value: '1.75rem' },
          { label: '2 rem (32 px)',    value: '2rem'    },
          { label: '2.25 rem (36 px)', value: '2.25rem' },
        ]),

        tagTypographyGroup('h4', 'H4 — Card / Widget Title', { font: 'Michroma', size: '1.375rem', weight: '400' }, [
          { label: '1.125 rem (18 px)', value: '1.125rem' },
          { label: '1.25 rem (20 px)',  value: '1.25rem'  },
          { label: '1.375 rem (22 px)', value: '1.375rem' },
          { label: '1.5 rem (24 px)',   value: '1.5rem'   },
          { label: '1.75 rem (28 px)',  value: '1.75rem'  },
        ]),

        tagTypographyGroup('h5', 'H5 — Label / Caption Heading', { font: 'Michroma', size: '1.125rem', weight: '400' }, [
          { label: '0.875 rem (14 px)', value: '0.875rem' },
          { label: '1 rem (16 px)',     value: '1rem'     },
          { label: '1.125 rem (18 px)', value: '1.125rem' },
          { label: '1.25 rem (20 px)',  value: '1.25rem'  },
        ]),

        tagTypographyGroup('h6', 'H6 — Fine Label / Overline', { font: 'Michroma', size: '1rem', weight: '400' }, [
          { label: '0.75 rem (12 px)',  value: '0.75rem'  },
          { label: '0.875 rem (14 px)', value: '0.875rem' },
          { label: '1 rem (16 px)',     value: '1rem'     },
          { label: '1.125 rem (18 px)', value: '1.125rem' },
        ]),

        tagTypographyGroup('p', 'Paragraph (p)', { font: 'DM Sans', size: '1rem', weight: '400' }, [
          { label: '0.875 rem (14 px)',  value: '0.875rem'  },
          { label: '1 rem (16 px)',      value: '1rem'      },
          { label: '1.0625 rem (17 px)', value: '1.0625rem' },
          { label: '1.125 rem (18 px)',  value: '1.125rem'  },
          { label: '1.25 rem (20 px)',   value: '1.25rem'   },
        ]),

        tagTypographyGroup('a', 'Link (a)', { font: 'DM Sans', size: 'inherit', weight: '500' }, [
          { label: 'Inherit from parent', value: 'inherit'  },
          { label: '0.875 rem (14 px)',   value: '0.875rem' },
          { label: '1 rem (16 px)',       value: '1rem'     },
          { label: '1.125 rem (18 px)',   value: '1.125rem' },
        ]),
      ],
    },

    // ─── Spacing ─────────────────────────────────────────────────────────────
    {
      name: 'spacing',
      type: 'group',
      label: 'Spacing',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'sectionGap',
              type: 'select',
              label: 'Vertical Gap Between Sections',
              options: [
                { label: 'Compact — 48 px', value: '48px' },
                { label: 'Normal — 80 px', value: '80px' },
                { label: 'Relaxed — 112 px', value: '112px' },
                { label: 'Spacious — 144 px', value: '144px' },
              ],
              defaultValue: '80px',
              admin: {
                width: '33.33%',
                description: 'Section top/bottom padding via --spacing-section.',
              },
            },
            {
              name: 'containerWidth',
              type: 'select',
              label: 'Page Container Max Width',
              options: [
                { label: 'Narrow — 1024 px', value: '1024px' },
                { label: 'Normal — 1200 px', value: '1200px' },
                { label: 'Wide — 1280 px', value: '1280px' },
                { label: 'Full — 1440 px', value: '1440px' },
              ],
              defaultValue: '1200px',
              admin: {
                width: '33.33%',
                description: 'Max width of the page wrapper at desktop.',
              },
            },
            {
              name: 'radius',
              type: 'select',
              label: 'Global Corner Radius',
              options: [
                { label: 'None — 0 px', value: '0px' },
                { label: 'Small — 4 px', value: '4px' },
                { label: 'Medium — 8 px', value: '8px' },
                { label: 'Large — 12 px', value: '12px' },
                { label: 'Pill — 9999 px', value: '9999px' },
              ],
              defaultValue: '8px',
              admin: {
                width: '33.33%',
                description: 'Default radius for cards, inputs, and sections.',
              },
            },
          ],
        },
      ],
    },

    // ─── Buttons ─────────────────────────────────────────────────────────────
    {
      name: 'buttons',
      type: 'group',
      label: 'Buttons',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'radius',
              type: 'select',
              label: 'Border Radius',
              options: [
                { label: 'Square — 0 px', value: '0px' },
                { label: 'Small — 4 px', value: '4px' },
                { label: 'Medium — 6 px', value: '6px' },
                { label: 'Large — 8 px', value: '8px' },
                { label: 'Pill — 9999 px', value: '9999px' },
              ],
              defaultValue: '6px',
              admin: { width: '33.33%' },
            },
            {
              name: 'appearance',
              type: 'select',
              label: 'Default Appearance',
              options: [
                { label: 'Solid (filled)', value: 'solid' },
                { label: 'Outline (border)', value: 'outline' },
                { label: 'Ghost (text)', value: 'ghost' },
                { label: 'Soft (tinted)', value: 'soft' },
              ],
              defaultValue: 'solid',
              admin: { width: '33.33%' },
            },
            {
              name: 'shadow',
              type: 'select',
              label: 'Drop Shadow',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Small', value: 'sm' },
                { label: 'Medium', value: 'md' },
              ],
              defaultValue: 'none',
              admin: { width: '33.33%' },
            },
          ],
        },
      ],
    },

    // ─── Shadows ─────────────────────────────────────────────────────────────
    {
      name: 'shadows',
      type: 'group',
      label: 'Shadows',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'card',
              type: 'select',
              label: 'Card / Panel Shadow',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Subtle (sm)', value: 'sm' },
                { label: 'Medium (md)', value: 'md' },
                { label: 'Elevated (lg)', value: 'lg' },
              ],
              defaultValue: 'sm',
              admin: { width: '50%' },
            },
            {
              name: 'overlay',
              type: 'select',
              label: 'Dialog / Drawer Shadow',
              options: [
                { label: 'Medium (md)', value: 'md' },
                { label: 'Large (lg)', value: 'lg' },
                { label: 'Extra Large (xl)', value: 'xl' },
              ],
              defaultValue: 'xl',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },

    // ─── Layout ──────────────────────────────────────────────────────────────
    {
      name: 'layout',
      type: 'group',
      label: 'Layout',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'sidePadding',
              type: 'select',
              label: 'Section Side Padding',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Tight — 24 px', value: '24px' },
                { label: 'Normal — 48 px', value: '48px' },
                { label: 'Wide — 80 px', value: '80px' },
              ],
              defaultValue: '48px',
              admin: {
                width: '50%',
                description: 'Horizontal padding inside full-width section wrappers.',
              },
            },
            {
              name: 'proseWidth',
              type: 'select',
              label: 'Reading / Prose Max Width',
              options: [
                { label: 'Narrow — 640 px', value: '640px' },
                { label: 'Normal — 800 px', value: '800px' },
                { label: 'Wide — 960 px', value: '960px' },
              ],
              defaultValue: '800px',
              admin: {
                width: '50%',
                description: 'Max width for long-form text (RichText, blog).',
              },
            },
          ],
        },
      ],
    },
  ],
}
