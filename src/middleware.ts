import { NextRequest, NextResponse } from 'next/server'

// ─── Locale config cache (module-level, Edge-runtime safe) ────────────────────

interface LocaleConfig {
  codes: string[]
  defaultCode: string
  ttl: number
}

let localesCache: LocaleConfig | null = null

async function getLocaleConfig(): Promise<LocaleConfig> {
  const now = Date.now()
  if (localesCache && now < localesCache.ttl) return localesCache

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/internal/locales`, {
      // Next.js fetch cache — revalidate every 60 seconds
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json() as { codes: string[]; defaultCode: string }
      localesCache = { codes: data.codes, defaultCode: data.defaultCode, ttl: now + 60_000 }
      return localesCache
    }
  } catch {
    // DB unavailable — fall through to hardcoded fallback
  }

  // Fallback: allow "en" as default so the site doesn't break on cold start
  localesCache = { codes: ['en'], defaultCode: 'en', ttl: now + 30_000 }
  return localesCache
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /api/* — all API routes (internal + Payload REST/GraphQL)
     * - /admin/* — Payload admin panel
     * - /_next/* — Next.js internals
     * - /favicon.ico, /robots.txt, /sitemap.xml, static assets
     */
    '/((?!api|admin|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js)).*)',
  ],
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const { codes, defaultCode } = await getLocaleConfig()

  const firstSegment = segments[0]

  // Root path "/" → redirect to /{defaultCode}/
  if (!firstSegment) {
    return NextResponse.redirect(new URL(`/${defaultCode}`, req.url))
  }

  // First segment is a valid locale code → pass through
  if (codes.includes(firstSegment)) {
    return NextResponse.next()
  }

  // No locale prefix → prepend default locale
  const rest = segments.join('/')
  return NextResponse.redirect(new URL(`/${defaultCode}/${rest}`, req.url))
}
