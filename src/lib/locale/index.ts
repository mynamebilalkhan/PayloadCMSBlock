import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface LocaleRecord {
  id: number | string
  name: string
  code: string
  isDefault: boolean
  isEnabled: boolean
  isRTL: boolean
  sortOrder: number
  flag?: string | null
}

// ─── Cached DB fetchers ───────────────────────────────────────────────────────

const fetchLocales = unstable_cache(
  async (): Promise<LocaleRecord[]> => {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'locales',
      where: { isEnabled: { equals: true } },
      sort: 'sortOrder',
      limit: 100,
    })
    return result.docs as unknown as LocaleRecord[]
  },
  ['locales'],
  { tags: ['locales'], revalidate: 300 },
)

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns all enabled locales ordered by sortOrder. */
export async function getLocales(): Promise<LocaleRecord[]> {
  return fetchLocales()
}

/** Returns the locale marked as default, or the first enabled locale as fallback. */
export async function getDefaultLocale(): Promise<LocaleRecord> {
  const locales = await fetchLocales()
  return locales.find((l) => l.isDefault) ?? locales[0]
}

/**
 * Returns the locale with the given code if it exists and is enabled.
 * Returns null if the code is unknown or the locale is disabled.
 */
export async function validateLocale(code: string): Promise<LocaleRecord | null> {
  const locales = await fetchLocales()
  return locales.find((l) => l.code === code) ?? null
}

/**
 * Resolves a locale code to a LocaleRecord.
 * Returns the default locale if the provided code is invalid or disabled.
 */
export async function resolveLocale(code: string): Promise<LocaleRecord> {
  const locale = await validateLocale(code)
  if (locale) return locale
  return getDefaultLocale()
}
