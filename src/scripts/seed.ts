/**
 * Seed script — registers all block definitions and creates a full demo home page.
 *
 * Run with:
 *   pnpm seed
 *
 * Re-running is safe:
 *   - Block definitions are upserted (schema updated if already exists)
 *   - Home page is created only if it doesn't exist, or updated if it has < 4 layout blocks
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normaliseSchema, saveSchemaLocally } from '@/builder'

// ─── Schema imports ───────────────────────────────────────────────────────────
import { heroBannerSchema }  from '@/blocks/HeroBanner'
import { richTextSchema }    from '@/blocks/RichText'
import { cardGridSchema }    from '@/blocks/CardGrid'
import { featuresSchema }    from '@/blocks/Features'
import { ctaSchema }         from '@/blocks/CTA'
import { testimonialsSchema } from '@/blocks/Testimonials'
import { faqSchema }         from '@/blocks/FAQ'
import { pricingSchema }     from '@/blocks/Pricing'
import {
  homeBannerSchema,
  homeVideoSchema,
  homeStorySchema,
  homeDoorsSchema,
  homeVoicesSchema,
  homeCtaSchema,
} from '@/blocks/home/schemas'

// ─── Preset imports ───────────────────────────────────────────────────────────
import { heroBannerPresets }   from '@/blocks/HeroBanner/presets'
import { featuresPresets }     from '@/blocks/Features/presets'
import { ctaPresets }          from '@/blocks/CTA/presets'
import { testimonialsPresets } from '@/blocks/Testimonials/presets'
import { faqPresets }          from '@/blocks/FAQ/presets'
import { pricingPresets }      from '@/blocks/Pricing/presets'
import { homeBannerPresets }   from '@/blocks/HomeBanner/presets'
import { homeVideoPresets }    from '@/blocks/HomeVideo/presets'
import { homeStoryPresets }    from '@/blocks/HomeStory/presets'
import { homeDoorsPresets }    from '@/blocks/HomeDoors/presets'
import { homeVoicesPresets }   from '@/blocks/HomeVoices/presets'
import { homeCtaPresets }      from '@/blocks/HomeCta/presets'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toId = (s: string) => parseInt(s, 10)

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

async function findCurrentMatchingVersion(
  payload: Awaited<ReturnType<typeof getPayload>>,
  blockSlug: string,
  rawSchema: unknown,
): Promise<{ definitionId: string; versionId: string; versionNumber: number } | null> {
  const existing = await payload.find({
    collection: 'block-definitions',
    where: { slug: { equals: blockSlug } },
    depth: 1,
    limit: 1,
  })

  const definition = existing.docs[0] as
    | {
        id: string | number
        currentVersion?: {
          id?: string | number
          schema?: unknown
          versionNumber?: number | null
        } | number | string | null
      }
    | undefined

  if (!definition || !definition.currentVersion || typeof definition.currentVersion !== 'object') {
    return null
  }

  const currentVersion = definition.currentVersion
  if (!currentVersion.id) return null

  const currentSchema = normaliseSchema(currentVersion.schema as Parameters<typeof normaliseSchema>[0])
  const nextSchema = normaliseSchema(rawSchema as Parameters<typeof normaliseSchema>[0])

  if (stableStringify(currentSchema) !== stableStringify(nextSchema)) {
    return null
  }

  return {
    definitionId: String(definition.id),
    versionId: String(currentVersion.id),
    versionNumber: currentVersion.versionNumber ?? 0,
  }
}

// ─── Block definition registry ────────────────────────────────────────────────

const blockDefs = [
  { blockSlug: 'hero-banner',  name: 'Hero Banner',  category: 'layout'  as const, description: 'Full-width hero section with variants, CTAs, and mockup.',          schema: heroBannerSchema,   changelog: 'Added variants and spacing controls' },
  { blockSlug: 'rich-text',    name: 'Rich Text',    category: 'content' as const, description: 'Styled prose content with alignment support.',                       schema: richTextSchema,     changelog: 'Enhanced prose styling' },
  { blockSlug: 'card-grid',    name: 'Card Grid',    category: 'content' as const, description: 'Responsive grid of feature cards with color accents.',               schema: cardGridSchema,     changelog: 'Added subheading field' },
  { blockSlug: 'features',     name: 'Features',     category: 'content' as const, description: 'Icon-based feature grid with 5 layout variants.',                   schema: featuresSchema,     changelog: 'Initial version' },
  { blockSlug: 'cta',          name: 'CTA',          category: 'content' as const, description: 'Call-to-action section with 6 style variants and centered/split layouts.', schema: ctaSchema,     changelog: 'Initial version' },
  { blockSlug: 'testimonials', name: 'Testimonials', category: 'content' as const, description: 'Customer testimonial grid with ratings and featured layout.',        schema: testimonialsSchema, changelog: 'Initial version' },
  { blockSlug: 'faq',          name: 'FAQ',          category: 'content' as const, description: 'Accordion FAQ block with single and two-column layouts.',            schema: faqSchema,          changelog: 'Initial version' },
  { blockSlug: 'pricing',      name: 'Pricing',      category: 'content' as const, description: 'Pricing plan cards with highlight support and 4 style variants.',    schema: pricingSchema,      changelog: 'Initial version' },
  { blockSlug: 'homebanner',   name: 'Home Banner',  category: 'content' as const, description: 'Nextbridge homepage hero and proof strip.',                          schema: homeBannerSchema,   changelog: 'Initial version' },
  { blockSlug: 'home-video',   name: 'Home Video',   category: 'content' as const, description: 'Nextbridge engineering floor video.',                                schema: homeVideoSchema,    changelog: 'Initial version' },
  { blockSlug: 'home-story',   name: 'Home Story',   category: 'content' as const, description: 'Nextbridge homepage story section.',                                 schema: homeStorySchema,    changelog: 'Initial version' },
  { blockSlug: 'home-doors',   name: 'Home Doors',   category: 'content' as const, description: 'Nextbridge homepage door cards.',                                    schema: homeDoorsSchema,    changelog: 'Initial version' },
  { blockSlug: 'home-voices',  name: 'Home Voices',  category: 'content' as const, description: 'Nextbridge homepage client testimonials.',                           schema: homeVoicesSchema,   changelog: 'Initial version' },
  { blockSlug: 'home-cta',     name: 'Home CTA',     category: 'content' as const, description: 'Nextbridge homepage closing call to action.',                        schema: homeCtaSchema,      changelog: 'Initial version' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const payload = await getPayload({ config })

  console.log('Seeding block definitions...\n')

  const results: Record<string, { definitionId: string; versionId: string }> = {}

  for (const block of blockDefs) {
    const existingVersion = await findCurrentMatchingVersion(payload, block.blockSlug, block.schema)
    if (existingVersion) {
      results[block.blockSlug] = {
        definitionId: existingVersion.definitionId,
        versionId: existingVersion.versionId,
      }
      console.log(`- ${block.blockSlug} - v${existingVersion.versionNumber} unchanged (id: ${existingVersion.versionId})`)
      continue
    }

    const result = await saveSchemaLocally(payload, block)
    if (result.success) {
      results[block.blockSlug] = {
        definitionId: result.definitionId,
        versionId: result.versionId,
      }
      console.log(`+ ${block.blockSlug} - v${result.versionNumber} (id: ${result.versionId})`)
      if (result.warnings?.length) result.warnings.forEach(w => console.warn(`  ! ${w}`))
    } else {
      console.error(`x ${block.blockSlug}:`, result.errors?.join(', '))
    }
  }

  // Abort if any definition failed
  const missing = blockDefs.filter(b => !results[b.blockSlug])
  if (missing.length > 0) {
    console.error(`\nx Aborting page seed - failed: ${missing.map(b => b.blockSlug).join(', ')}`)
    process.exit(1)
  }

  // ─── Home page ──────────────────────────────────────────────────────────────

  const r = results as Record<string, { definitionId: string; versionId: string }>

  const NEXTBRIDGE_HOME_BLOCK_COUNT = 6

  const layoutBlocks = [
    {
      blockDefinition: toId(r['homebanner']!.definitionId),
      blockVersion:    toId(r['homebanner']!.versionId),
      label: 'Banner',
      hidden: false,
      data: homeBannerPresets[0]!.data,
    },
    {
      blockDefinition: toId(r['home-video']!.definitionId),
      blockVersion:    toId(r['home-video']!.versionId),
      label: 'Video',
      hidden: false,
      data: homeVideoPresets[0]!.data,
    },
    {
      blockDefinition: toId(r['home-story']!.definitionId),
      blockVersion:    toId(r['home-story']!.versionId),
      label: 'Story',
      hidden: false,
      data: homeStoryPresets[0]!.data,
    },
    {
      blockDefinition: toId(r['home-doors']!.definitionId),
      blockVersion:    toId(r['home-doors']!.versionId),
      label: 'Doors',
      hidden: false,
      data: homeDoorsPresets[0]!.data,
    },
    {
      blockDefinition: toId(r['home-voices']!.definitionId),
      blockVersion:    toId(r['home-voices']!.versionId),
      label: 'Voices',
      hidden: false,
      data: homeVoicesPresets[0]!.data,
    },
    {
      blockDefinition: toId(r['home-cta']!.definitionId),
      blockVersion:    toId(r['home-cta']!.versionId),
      label: 'CTA',
      hidden: false,
      data: homeCtaPresets[0]!.data,
    },
  ]

  console.log('\nChecking home page...')

  const defaultLocaleResult = await payload.find({
    collection: 'locales',
    where: { isDefault: { equals: true } },
    limit: 1,
  })
  const defaultLocale = defaultLocaleResult.docs[0]
  if (!defaultLocale) {
    console.error('\nx No default locale found. Run migrations or create a locale in Admin first.')
    process.exit(1)
  }

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: '/' } },
    limit: 1,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData: any = {
    title: 'Home',
    slug: '/',
    locale: defaultLocale.id,
    status: 'published',
    seo: {
      metaTitle: 'NEXTBRIDGE — Engineering since 1996',
      metaDescription: 'Senior engineers embedded into product teams. Built to deliver, not to sell.',
    },
    dbLayout: layoutBlocks,
  }

  const { slug: _slug, ...pageRepairData } = pageData

  if (existing.docs.length > 0) {
    const page = existing.docs[0]!
    const currentLayoutLength = ((page.dbLayout as unknown[]) ?? []).length

    if (currentLayoutLength < NEXTBRIDGE_HOME_BLOCK_COUNT) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload.update as any)({
        collection: 'pages',
        id: page.id,
        data: pageRepairData,
        skipValidation: true,
      })
      console.log(`+ Home page updated with Nextbridge layout (was ${currentLayoutLength} blocks, now ${layoutBlocks.length})`)
    } else {
      console.log(`- Home page already has ${currentLayoutLength} blocks - skipping update`)
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload.create as any)({
      collection: 'pages',
      data: pageData,
    })
    console.log(`+ Home page created with ${layoutBlocks.length} prebuilt blocks`)
  }

  console.log('\nDone. Run `pnpm dev` and visit http://localhost:3000 to see the demo.')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
