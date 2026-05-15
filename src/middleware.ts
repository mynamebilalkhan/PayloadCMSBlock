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
    '/((?!api|admin|block-builder|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js)).*)',
  ],
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const { codes, defaultCode } = await getLocaleConfig()

  const firstSegment = segments[0]

  // If the DB has no enabled locales yet, treat defaultCode as the only valid code
  const validCodes = codes.length > 0 ? codes : [defaultCode]

  // Path starts with the default locale prefix (e.g. /en or /en/our-story)
  // → redirect to the clean URL without the prefix
  if (firstSegment === defaultCode) {
    const rest = segments.slice(1).join('/')
    const cleanPath = rest ? `/${rest}` : '/'
    return NextResponse.redirect(new URL(cleanPath, req.url))
  }

  // Path starts with a non-default locale code (e.g. /fr/our-story)
  // → pass through unchanged
  if (validCodes.includes(firstSegment)) {
    return NextResponse.next()
  }

  // No locale prefix (including root "/") → rewrite to default locale internally.
  // The browser URL stays as-is; Next.js routes it under [locale]=defaultCode.
  return NextResponse.rewrite(new URL(`/${defaultCode}${pathname}`, req.url))
}
