/**
 * GET /api/internal/seed-home
 * Development-only: registers Nextbridge home block definitions and updates the home page layout.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { saveSchemaLocally } from '@/builder'
import {
  homeBannerSchema,
  homeVideoSchema,
  homeStorySchema,
  homeDoorsSchema,
  homeVoicesSchema,
  homeCtaSchema,
} from '@/blocks/home/schemas'
import { homeBannerPresets } from '@/blocks/HomeBanner/presets'
import { homeVideoPresets } from '@/blocks/HomeVideo/presets'
import { homeStoryPresets } from '@/blocks/HomeStory/presets'
import { homeDoorsPresets } from '@/blocks/HomeDoors/presets'
import { homeVoicesPresets } from '@/blocks/HomeVoices/presets'
import { homeCtaPresets } from '@/blocks/HomeCta/presets'

const HOME_BLOCKS = [
  { blockSlug: 'homebanner', name: 'Home Banner', category: 'content' as const, schema: homeBannerSchema, preset: homeBannerPresets[0]!.data },
  { blockSlug: 'home-video', name: 'Home Video', category: 'content' as const, schema: homeVideoSchema, preset: homeVideoPresets[0]!.data },
  { blockSlug: 'home-story', name: 'Home Story', category: 'content' as const, schema: homeStorySchema, preset: homeStoryPresets[0]!.data },
  { blockSlug: 'home-doors', name: 'Home Doors', category: 'content' as const, schema: homeDoorsSchema, preset: homeDoorsPresets[0]!.data },
  { blockSlug: 'home-voices', name: 'Home Voices', category: 'content' as const, schema: homeVoicesSchema, preset: homeVoicesPresets[0]!.data },
  { blockSlug: 'home-cta', name: 'Home CTA', category: 'content' as const, schema: homeCtaSchema, preset: homeCtaPresets[0]!.data },
]

const toId = (s: string) => parseInt(s, 10)

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const payload = await getPayload({ config })
  const results: Record<string, { definitionId: string; versionId: string }> = {}

  for (const block of HOME_BLOCKS) {
    const result = await saveSchemaLocally(payload, {
      blockSlug: block.blockSlug,
      name: block.name,
      category: block.category,
      schema: block.schema,
      changelog: 'Nextbridge home block',
    })
    if (!result.success) {
      return NextResponse.json({ error: `Failed ${block.blockSlug}`, details: result.errors }, { status: 422 })
    }
    results[block.blockSlug] = { definitionId: result.definitionId, versionId: result.versionId }
  }

  const defaultLocale = await payload.find({
    collection: 'locales',
    where: { isDefault: { equals: true } },
    limit: 1,
  })
  const locale = defaultLocale.docs[0]
  if (!locale || locale.id == null) {
    return NextResponse.json({ error: 'No default locale' }, { status: 500 })
  }

  const dbLayout = HOME_BLOCKS.map((block) => ({
    blockDefinition: toId(results[block.blockSlug]!.definitionId),
    blockVersion: toId(results[block.blockSlug]!.versionId),
    hidden: false,
    data: block.preset,
  }))

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: '/' }, locale: { equals: locale.id } },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { dbLayout } as any,
    })
  } else {
    await payload.create({
      collection: 'pages',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        title: 'Home',
        slug: '/',
        locale: locale.id,
        status: 'published',
        dbLayout,
      } as any,
    })
  }

  return NextResponse.json({ ok: true, blocks: Object.keys(results) })
}
