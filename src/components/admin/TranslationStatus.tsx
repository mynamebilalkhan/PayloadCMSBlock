'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentInfo, useFormFields, useFormModified } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'
import {
  buildPageAdminUrl,
  confirmLeaveIfModified,
  isSamePage,
  type LocaleOption,
  type SiblingPage,
} from '@/lib/admin/pageTranslationNav'
import { relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'
import { usePageTranslationSiblings } from '@/hooks/usePageTranslationSiblings'

interface TranslationPage extends SiblingPage {
  title: string
  slug: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TranslationStatus(props: UIFieldClientProps) {
  return (
    <ClientOnlyAdminField
      fallback={
        <div className="field-type ui" style={{ marginTop: 8 }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--theme-elevation-400)',
              marginBottom: 8,
            }}
          >
            Translations
          </label>
        </div>
      }
    >
      <TranslationStatusContent {...props} />
    </ClientOnlyAdminField>
  )
}

function TranslationStatusContent(_props: UIFieldClientProps) {
  const router = useRouter()
  const modified = useFormModified()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: currentPageId } = useDocumentInfo() as any as { id?: string | number }

  const translationGroupId = useFormFields(([fields]) =>
    fields.translationGroupId?.value as string | undefined,
  )
  const currentLocale = useFormFields(([fields]) =>
    fields.locale?.value as string | number | undefined,
  )

  const { locales, siblingByLocale, loading } = usePageTranslationSiblings(
    translationGroupId,
    currentPageId,
  )

  const navigateToTranslation = useCallback(
    (pageId: string | number) => {
      if (isSamePage(currentPageId, pageId)) return
      if (!confirmLeaveIfModified(modified)) return
      router.push(buildPageAdminUrl(pageId))
    },
    [currentPageId, modified, router],
  )

  if (!translationGroupId) {
    return (
      <div className="field-type ui">
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: '12px', marginTop: 0 }}>
          Translation group ID will be generated on save.
        </p>
      </div>
    )
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
          color: 'var(--theme-elevation-400)',
          marginBottom: 8,
        }}
      >
        Translations
      </label>
      <p
        style={{
          margin: '0 0 10px',
          fontSize: '11px',
          color: 'var(--theme-elevation-400)',
          lineHeight: 1.4,
        }}
      >
        Click a language to open that translation, or use the Locale dropdown above.
      </p>

      {loading && (
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)' }}>Loading…</p>
      )}

      {!loading && locales.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)' }}>
          No locales configured. Create a locale in{' '}
          <a href="/admin/collections/locales" style={{ color: 'var(--theme-success-500)' }}>
            Site Settings → Locales
          </a>
          .
        </p>
      )}

      {!loading && locales.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {locales.map((locale) => {
            const page = siblingByLocale.get(String(locale.id)) as TranslationPage | undefined
            const isCurrent =
              currentLocale === locale.id || String(currentLocale) === String(locale.id)

            return (
              <TranslationRow
                key={locale.id}
                locale={locale}
                page={page}
                isCurrent={isCurrent}
                onOpen={page ? () => navigateToTranslation(page.id) : undefined}
                onCreate={() => {
                  document.getElementById('translate-to-locale-btn')?.click()
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function TranslationRow({
  locale,
  page,
  isCurrent,
  onOpen,
  onCreate,
}: {
  locale: LocaleOption
  page?: TranslationPage
  isCurrent: boolean
  onOpen?: () => void
  onCreate: () => void
}) {
  const canOpen = Boolean(page && onOpen && !isCurrent)

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 6,
    background: isCurrent ? 'var(--theme-elevation-150)' : 'var(--theme-elevation-100)',
    border: `1px solid ${isCurrent ? 'var(--theme-success-250)' : 'var(--theme-border-color)'}`,
    fontSize: '13px',
    color: 'var(--theme-text)',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
  }

  if (canOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={`Open ${locale.name} translation`}
        style={{ ...rowStyle, cursor: 'pointer' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--theme-success-500)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--theme-border-color)'
        }}
      >
        <TranslationRowContent locale={locale} page={page} isCurrent={isCurrent} showOpenHint />
      </button>
    )
  }

  return (
    <div style={rowStyle}>
      <TranslationRowContent
        locale={locale}
        page={page}
        isCurrent={isCurrent}
        onCreate={!page && !isCurrent ? onCreate : undefined}
      />
    </div>
  )
}

function TranslationRowContent({
  locale,
  page,
  isCurrent,
  showOpenHint,
  onCreate,
}: {
  locale: LocaleOption
  page?: TranslationPage
  isCurrent: boolean
  showOpenHint?: boolean
  onCreate?: () => void
}) {
  return (
    <>
      {locale.flag && <span style={{ fontSize: '16px' }}>{locale.flag}</span>}
      <span style={{ fontWeight: isCurrent ? 600 : 400, flex: 1 }}>
        {locale.name} ({locale.code})
        {isCurrent && (
          <span
            style={{
              marginLeft: 6,
              fontSize: '11px',
              color: 'var(--theme-success-500)',
              fontWeight: 400,
            }}
          >
            current
          </span>
        )}
        {page && !isCurrent && page.title && (
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--theme-elevation-400)',
              fontWeight: 400,
              marginTop: 2,
            }}
          >
            {page.title}
          </span>
        )}
      </span>
      {showOpenHint && (
        <span style={{ fontSize: '12px', color: 'var(--theme-success-500)', fontWeight: 500 }}>
          Open →
        </span>
      )}
      {onCreate && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCreate()
          }}
          style={{
            fontSize: '12px',
            color: 'var(--theme-success-500)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            padding: 0,
          }}
        >
          Create
        </button>
      )}
    </>
  )
}
