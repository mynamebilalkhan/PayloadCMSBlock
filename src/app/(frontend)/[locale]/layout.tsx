import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SiteHeader } from '@/components/layout/Header'
import { SiteFooter } from '@/components/layout/Footer'
import { ThemeProvider } from '@/theme/context'
import { resolveTheme, tokensToCSS, buildGoogleFontsURL } from '@/theme/resolver'
import { defaultTheme } from '@/theme/tokens'
import { LocaleProvider } from '@/lib/locale/context'
import { validateLocale } from '@/lib/locale'
import type { SiteHeaderProps } from '@/components/layout/Header'
import type { SiteFooterProps } from '@/components/layout/Footer'
import type { ThemeTokens } from '@/theme/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

type Params = Promise<{ locale: string }>

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getLocaleGlobals(localeCode: string, localeId: string | number): Promise<{
  header: SiteHeaderProps
  footer: SiteFooterProps
  theme: ThemeTokens
}> {
  try {
    const payload = await getPayload({ config })

    const [headerResult, footerResult, themeRaw] = await Promise.all([
      // Fetch header for this locale; fall back to any header-locale if none found
      payload.find({
        collection: 'header-locales',
        where: { locale: { equals: localeId } },
        depth: 1,
        limit: 1,
      }),
      payload.find({
        collection: 'footer-locales',
        where: { locale: { equals: localeId } },
        depth: 1,
        limit: 1,
      }),
      payload.findGlobal({ slug: 'theme', depth: 0 }),
    ])

    // Fallback: if no locale-specific header, try to find the default-locale header
    let header: SiteHeaderProps = {}
    if (headerResult.docs.length > 0) {
      header = headerResult.docs[0] as unknown as SiteHeaderProps
    } else {
      // Try default-locale header as fallback
      const defaultHeader = await payload.find({
        collection: 'header-locales',
        limit: 1,
        sort: 'locale',
        depth: 1,
      })
      if (defaultHeader.docs.length > 0) {
        header = defaultHeader.docs[0] as unknown as SiteHeaderProps
      }
    }

    let footer: SiteFooterProps = {}
    if (footerResult.docs.length > 0) {
      footer = footerResult.docs[0] as unknown as SiteFooterProps
    } else {
      const defaultFooter = await payload.find({
        collection: 'footer-locales',
        limit: 1,
        sort: 'locale',
        depth: 1,
      })
      if (defaultFooter.docs.length > 0) {
        footer = defaultFooter.docs[0] as unknown as SiteFooterProps
      }
    }

    return {
      header,
      footer,
      theme: resolveTheme(themeRaw as unknown as Record<string, unknown>),
    }
  } catch {
    return { header: {}, footer: {}, theme: defaultTheme }
  }
}

// ─── Locale layout ────────────────────────────────────────────────────────────

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const { locale: localeCode } = await params

  // Validate locale — middleware should have caught invalid codes, but belt+suspenders
  const localeData = await validateLocale(localeCode)
  if (!localeData) {
    notFound()
  }

  const { header, footer, theme } = await getLocaleGlobals(localeCode, localeData.id)
  const themeCSS = tokensToCSS(theme)
  const googleFontsURL = buildGoogleFontsURL(theme)

  return (
    <LocaleProvider locale={localeData}>
      <html lang={localeCode} dir={localeData.isRTL ? 'rtl' : 'ltr'}>
        <head>
          {googleFontsURL && (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
              <link rel="stylesheet" href={googleFontsURL} />
            </>
          )}
          <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
        </head>
        <body className="antialiased">
          <ThemeProvider theme={theme}>
            <SiteHeader
              logo={(header as Record<string, unknown>).logo as SiteHeaderProps['logo']}
              navigationItems={(header as Record<string, unknown>).navigationItems as SiteHeaderProps['navigationItems']}
              ctaButton={(header as Record<string, unknown>).ctaButton as SiteHeaderProps['ctaButton']}
              stickyHeader={(header as Record<string, unknown>).stickyHeader as boolean | undefined}
            />
            <main>{children}</main>
            <SiteFooter
              logo={(footer as Record<string, unknown>).logo as SiteFooterProps['logo']}
              columns={(footer as Record<string, unknown>).columns as SiteFooterProps['columns']}
              copyright={(footer as Record<string, unknown>).copyright as string | undefined}
              socialLinks={(footer as Record<string, unknown>).socialLinks as SiteFooterProps['socialLinks']}
            />
          </ThemeProvider>
        </body>
      </html>
    </LocaleProvider>
  )
}
