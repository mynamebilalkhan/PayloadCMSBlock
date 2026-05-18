import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'

async function fetchLocaleId(code: string): Promise<string | number | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'locales',
    where: { code: { equals: code }, isEnabled: { equals: true } },
    limit: 1,
  })
  return result.docs[0]?.id ?? null
}

function getCachedLocaleId(code: string) {
  return unstable_cache(
    () => fetchLocaleId(code),
    ['locale-id-by-code', code],
    { tags: ['locales'], revalidate: 300 },
  )()
}

export const getPage = cache(async function getPage(
  slug: string,
  localeCode: string,
  isDraft = false,
) {
  try {
    const localeId = await getCachedLocaleId(localeCode)
    if (localeId == null) {
      console.warn('[getPage] No enabled locale found for code:', localeCode)
      return null
    }

    const payload = await getPayload({ config })

    const where: Where = {
      slug: { equals: slug },
      locale: { equals: localeId },
      ...(isDraft ? {} : { status: { equals: 'published' } }),
    }

    const result = await payload.find({
      collection: 'pages',
      where,
      limit: 1,
      depth: 2,
    })

    return result?.docs?.[0] ?? null
  } catch (err) {
    console.error('[getPage] Fatal error:', err, { slug, localeCode, isDraft })
    return null
  }
})
