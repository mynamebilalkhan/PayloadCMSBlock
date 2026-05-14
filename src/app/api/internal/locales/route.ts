import { getPayload } from 'payload'
import config from '@payload-config'
import type { LocaleRecord } from '@/lib/locale'

// Runs in Node.js runtime — can use the Postgres adapter freely
export const runtime = 'nodejs'

/**
 * GET /api/internal/locales
 *
 * Returns the list of enabled locale codes and the default locale code.
 * Used by the Edge-runtime middleware which cannot query the DB directly.
 * Response is cached by Next.js for 60 seconds.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'locales',
      where: { isEnabled: { equals: true } },
      sort: 'sortOrder',
      limit: 100,
    })

    const locales = result.docs as unknown as LocaleRecord[]
    const defaultLocale = locales.find((l) => l.isDefault) ?? locales[0]

    return Response.json(
      {
        codes: locales.map((l) => l.code),
        defaultCode: defaultLocale?.code ?? 'en',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch {
    // Fallback to English if DB is unavailable (e.g. cold start)
    return Response.json({ codes: ['en'], defaultCode: 'en' })
  }
}
