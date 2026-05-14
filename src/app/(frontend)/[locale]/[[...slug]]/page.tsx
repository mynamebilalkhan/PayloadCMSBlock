import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import { DynamicRenderer } from '@/renderer'
import type { PopulatedBlockInstance } from '@/renderer'
import { RenderContentBlocks } from '@/blocks/RenderContentBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import type { Metadata } from 'next'

// ─── Types ────────────────────────────────────────────────────────────────────

type Params = Promise<{ locale: string; slug?: string[] }>

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPage(slug: string, localeCode: string, isDraft = false) {
  const payload = await getPayload({ config })

  // Resolve the locale document for this code
  const localeResult = await payload.find({
    collection: 'locales',
    where: { code: { equals: localeCode }, isEnabled: { equals: true } },
    limit: 1,
  })

  const localeDoc = localeResult.docs[0]
  if (!localeDoc) return null

  const where: Where = {
    slug: { equals: slug },
    locale: { equals: localeDoc.id },
    ...(isDraft ? {} : { status: { equals: 'published' } }),
  }

  const result = await payload.find({
    collection: 'pages',
    where,
    limit: 1,
    depth: 3, // populate blockDefinition + blockVersion relationships
  })

  return result.docs[0] ?? null
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: localeCode, slug: slugParts } = await params
  const slug = slugParts?.join('/') ?? '/'
  const page = await getPage(slug, localeCode)

  if (!page) return { title: 'Not Found' }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const seo = page.seo as
    | { metaTitle?: string; metaDescription?: string; ogImage?: { url?: string } | null; noIndex?: boolean }
    | undefined

  // Build hreflang alternates from other translation variants
  const translationGroupId = page.translationGroupId as string | null
  let alternates: Metadata['alternates'] = undefined

  if (translationGroupId) {
    try {
      const payload = await getPayload({ config })
      const variants = await payload.find({
        collection: 'pages',
        where: {
          translationGroupId: { equals: translationGroupId },
          status: { equals: 'published' },
        },
        depth: 1,
        limit: 50,
      })

      const languages: Record<string, string> = {}
      for (const variant of variants.docs) {
        const variantLocaleCode = (variant.locale as { code?: string } | null)?.code
        if (!variantLocaleCode) continue
        const variantSlug = variant.slug as string
        const path = variantSlug === '/' ? '' : `/${variantSlug}`
        languages[variantLocaleCode] = `${serverUrl}/${variantLocaleCode}${path}`
      }

      const canonicalPath = slug === '/' ? '' : `/${slug}`
      alternates = {
        canonical: `${serverUrl}/${localeCode}${canonicalPath}`,
        languages,
      }
    } catch {
      // hreflang is non-critical — skip silently if it fails
    }
  }

  return {
    title: seo?.metaTitle ?? (page.title as string),
    description: seo?.metaDescription ?? undefined,
    robots: seo?.noIndex ? { index: false, follow: false } : undefined,
    alternates,
    openGraph: {
      title: seo?.metaTitle ?? (page.title as string),
      description: seo?.metaDescription ?? undefined,
      ...(seo?.ogImage?.url ? { images: [{ url: seo.ogImage.url }] } : {}),
      locale: localeCode,
    },
  }
}

// ─── Static params (SSG) ──────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })

    const [localesResult, pagesResult] = await Promise.all([
      payload.find({
        collection: 'locales',
        where: { isEnabled: { equals: true } },
        limit: 100,
      }),
      payload.find({
        collection: 'pages',
        where: { status: { equals: 'published' } },
        depth: 1, // populate locale for code lookup
        limit: 500,
      }),
    ])

    const enabledLocaleCodes = new Set(
      localesResult.docs.map((l) => l.code as string),
    )

    return pagesResult.docs
      .filter((page) => {
        const localeCode = (page.locale as { code?: string } | null)?.code
        return localeCode && enabledLocaleCodes.has(localeCode)
      })
      .map((page) => {
        const localeCode = (page.locale as { code: string }).code
        const slugStr = page.slug as string
        return {
          locale: localeCode,
          slug: slugStr === '/' ? [] : slugStr.split('/').filter(Boolean),
        }
      })
  } catch {
    return []
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function LocaleFrontendPage({ params }: { params: Params }) {
  const { locale: localeCode, slug: slugParts } = await params
  const slug = slugParts?.join('/') ?? '/'

  const { isEnabled: isDraftMode } = await draftMode()
  const page = await getPage(slug, localeCode, isDraftMode)
  if (!page) notFound()

  const dbLayout = (page.dbLayout ?? []) as unknown as PopulatedBlockInstance[]
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageAny = page as any

  return (
    <>
      {isDraftMode && <LivePreviewListener serverURL={serverURL} />}
      <RenderHero hero={pageAny.hero} />
      <DynamicRenderer layout={dbLayout} />
      <RenderContentBlocks blocks={page.contentBlocks} />
    </>
  )
}
