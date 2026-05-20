'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentInfo, useFormFields, useFormModified } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'

import { AdminButton, adminUIStyles } from '@/components/admin/AdminUI'
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
  return <TranslationStatusContent {...props} />
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
        <div className={adminUIStyles.stack}>
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

  if (canOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={`Open ${locale.name} translation`}
        className={[adminUIStyles.optionRow, adminUIStyles.optionButton].join(' ')}
      >
        <TranslationRowContent locale={locale} page={page} isCurrent={isCurrent} showOpenHint />
      </button>
    )
  }

  return (
    <div
      className={[
        adminUIStyles.optionRow,
        isCurrent ? adminUIStyles.optionSelected : '',
      ].filter(Boolean).join(' ')}
    >
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
        <AdminButton
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCreate()
          }}
          tone="bare"
        >
          Create
        </AdminButton>
      )}
    </>
  )
}
