'use client'

import React, { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocaleDoc {
  id: string | number
  name: string
  code: string
  flag?: string | null
}

interface TranslationPage {
  id: string | number
  title: string
  slug: string
  locale: LocaleDoc
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TranslationStatus(_props: UIFieldClientProps) {
  const translationGroupId = useFormFields(([fields]) =>
    fields.translationGroupId?.value as string | undefined,
  )
  const currentLocale = useFormFields(([fields]) =>
    fields.locale?.value as string | number | undefined,
  )

  const [translations, setTranslations] = useState<TranslationPage[]>([])
  const [allLocales, setAllLocales] = useState<LocaleDoc[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!translationGroupId) return

    setLoading(true)

    Promise.all([
      // Fetch sibling translations
      fetch(
        `/api/pages?where[translationGroupId][equals]=${encodeURIComponent(translationGroupId)}&depth=1&limit=50`,
      ).then((r) => r.json()),
      // Fetch all available locales
      fetch('/api/locales?limit=100&sort=sortOrder').then((r) => r.json()),
    ])
      .then(([pagesRes, localesRes]) => {
        setTranslations((pagesRes.docs ?? []) as TranslationPage[])
        setAllLocales((localesRes.docs ?? []) as LocaleDoc[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [translationGroupId])

  if (!translationGroupId) {
    return (
      <div className="field-type ui">
        <p style={{ color: '#888', fontSize: '12px', marginTop: 0 }}>
          Translation group ID will be generated on save.
        </p>
      </div>
    )
  }

  const translationByLocaleId = new Map<string | number, TranslationPage>()
  for (const t of translations) {
    if (t.locale?.id !== undefined) {
      translationByLocaleId.set(t.locale.id, t)
    }
  }

  return (
    <div className="field-type ui" style={{ marginTop: 8 }}>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: '#888',
          marginBottom: 8,
        }}
      >
        Translations
      </label>

      {loading && (
        <p style={{ fontSize: '12px', color: '#888' }}>Loading…</p>
      )}

      {!loading && allLocales.length === 0 && (
        <p style={{ fontSize: '12px', color: '#888' }}>
          No locales configured. Create a locale in{' '}
          <a href="/admin/collections/locales" style={{ color: '#3b82f6' }}>
            Site Settings → Locales
          </a>
          .
        </p>
      )}

      {!loading && allLocales.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allLocales.map((locale) => {
            const page = translationByLocaleId.get(locale.id)
            const isCurrent =
              currentLocale === locale.id || String(currentLocale) === String(locale.id)

            return (
              <div
                key={locale.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: isCurrent ? '#eff6ff' : '#f9fafb',
                  border: `1px solid ${isCurrent ? '#bfdbfe' : '#e5e7eb'}`,
                  fontSize: '13px',
                }}
              >
                {locale.flag && (
                  <span style={{ fontSize: '16px' }}>{locale.flag}</span>
                )}
                <span style={{ fontWeight: isCurrent ? 600 : 400, flex: 1 }}>
                  {locale.name} ({locale.code})
                  {isCurrent && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: '11px',
                        color: '#3b82f6',
                        fontWeight: 400,
                      }}
                    >
                      current
                    </span>
                  )}
                </span>
                {page ? (
                  <a
                    href={`/admin/collections/pages/${page.id}`}
                    style={{
                      fontSize: '12px',
                      color: '#059669',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Open
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Not translated
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
