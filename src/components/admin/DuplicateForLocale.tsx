'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import { AdminButton, adminUIStyles } from '@/components/admin/AdminUI'
import { relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocaleOption {
  id: string | number
  name: string
  code: string
  flag?: string | null
}

interface TranslationPage {
  id: string | number
  locale: string | number | null
}

type LocaleRow =
  | { kind: 'available'; locale: LocaleOption }
  | { kind: 'translated'; locale: LocaleOption; pageId: string | number }
  | { kind: 'current'; locale: LocaleOption }

function serializeTargetLocaleId(id: string | number): string | number {
  const n = Number(id)
  return Number.isFinite(n) && String(n) === String(id) ? n : id
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DuplicateForLocale() {
  return <DuplicateForLocaleContent />
}

function DuplicateForLocaleContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: pageId } = useDocumentInfo() as any as { id?: string | number }
  const router = useRouter()

  const currentLocale = useFormFields(([fields]) =>
    fields.locale?.value as string | number | undefined,
  )
  const translationGroupId = useFormFields(([fields]) =>
    fields.translationGroupId?.value as string | undefined,
  )

  const [open, setOpen] = useState(false)
  const [localeRows, setLocaleRows] = useState<LocaleRow[]>([])
  const [selectedLocaleId, setSelectedLocaleId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingLocales, setLoadingLocales] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableLocales = localeRows.filter(
    (r): r is Extract<LocaleRow, { kind: 'available' }> => r.kind === 'available',
  )

  const loadModalData = useCallback(async () => {
    setLoadingLocales(true)
    setError(null)
    try {
      const localesRes = await fetch(
        '/api/locales?where[isEnabled][equals]=true&limit=100&sort=sortOrder',
        { credentials: 'same-origin' },
      )
      const localesData = await localesRes.json() as { docs: LocaleOption[] }
      const allLocales = localesData.docs ?? []

      const translationByLocaleId = new Map<string, TranslationPage>()
      if (translationGroupId) {
        const pagesRes = await fetch(
          `/api/pages?where[translationGroupId][equals]=${encodeURIComponent(translationGroupId)}&depth=0&limit=50`,
          { credentials: 'same-origin' },
        )
        const pagesData = await pagesRes.json() as { docs: TranslationPage[] }
        for (const page of pagesData.docs ?? []) {
          if (page.locale != null) {
            translationByLocaleId.set(String(page.locale), page)
          }
        }
      }

      const rows: LocaleRow[] = allLocales.map((locale) => {
        if (relationshipIdsEqual(currentLocale, locale.id)) {
          return { kind: 'current' as const, locale }
        }
        const existing = translationByLocaleId.get(String(locale.id))
        if (existing) {
          return { kind: 'translated' as const, locale, pageId: existing.id }
        }
        return { kind: 'available' as const, locale }
      })

      setLocaleRows(rows)
      const firstAvailable = rows.find((r) => r.kind === 'available')
      setSelectedLocaleId(firstAvailable ? String(firstAvailable.locale.id) : '')
    } catch {
      setError('Could not load locales.')
    } finally {
      setLoadingLocales(false)
    }
  }, [translationGroupId, currentLocale])

  const openModal = () => {
    setOpen(true)
    void loadModalData()
  }

  const handleDuplicate = async () => {
    if (!selectedLocaleId || !pageId) return

    setLoading(true)
    setError(null)

    const targetLocaleId = serializeTargetLocaleId(selectedLocaleId)

    try {
      const res = await fetch('/api/admin/duplicate-page-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ pageId, targetLocaleId }),
      })
      const data = await res.json() as {
        success?: boolean
        pageId?: string | number
        error?: string
        existingId?: string | number
      }

      if (!res.ok) {
        if (res.status === 409 && data.existingId) {
          router.push(`/admin/collections/pages/${data.existingId}`)
          setOpen(false)
          return
        }
        setError(data.error ?? 'Could not create translation.')
        return
      }

      if (data.success && data.pageId) {
        router.push(`/admin/collections/pages/${data.pageId}`)
        setOpen(false)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!pageId) return null

  const canCreate =
    Boolean(translationGroupId) &&
    Boolean(selectedLocaleId) &&
    availableLocales.length > 0 &&
    !loading

  return (
    <>
      <AdminButton
        id="translate-to-locale-btn"
        type="button"
        onClick={openModal}
      >
        Translate to…
      </AdminButton>

      {open && (
        <ModalOverlay onClose={() => setOpen(false)}>
          <div
            style={{
              background: 'var(--theme-elevation-0, var(--theme-bg))',
              border: '1px solid var(--theme-border-color)',
              borderRadius: 12,
              padding: 24,
              minWidth: 320,
              maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              color: 'var(--theme-text)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--theme-text)' }}>
              Create translation
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
              Creates a draft copy in the selected locale with the same page builder layout. Edit and publish when ready.
            </p>

            {!translationGroupId && (
              <p style={{ color: 'var(--theme-warning-500)', fontSize: '13px', marginBottom: 12 }}>
                Save this page first to generate a translation group ID.
              </p>
            )}

            {loadingLocales && (
              <p style={{ color: 'var(--theme-elevation-400)', fontSize: '13px' }}>Loading locales…</p>
            )}

            {!loadingLocales && localeRows.length > 0 && (
              <LocalePickerList
                rows={localeRows}
                selectedLocaleId={selectedLocaleId}
                onSelect={setSelectedLocaleId}
              />
            )}

            {!loadingLocales && localeRows.length > 0 && availableLocales.length === 0 && (
              <p style={{ color: 'var(--theme-elevation-400)', fontSize: '13px', marginBottom: 12 }}>
                All enabled locales already have a translation for this page.
              </p>
            )}

            {error && (
              <p style={{ color: 'var(--theme-error-500)', fontSize: '13px', marginBottom: 12 }}>{error}</p>
            )}

            <ModalActions
              onCancel={() => setOpen(false)}
              onCreate={handleDuplicate}
              canCreate={canCreate}
              loading={loading}
            />
          </div>
        </ModalOverlay>
      )}
    </>
  )
}

function LocalePickerList({
  rows,
  selectedLocaleId,
  onSelect,
}: {
  rows: LocaleRow[]
  selectedLocaleId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className={adminUIStyles.stack}>
      {rows.map((row) => {
        const { locale } = row
        const idStr = String(locale.id)

        if (row.kind === 'current') {
          return (
            <div
              key={idStr}
              className={adminUIStyles.optionRow}
            >
              {locale.flag && <span style={{ fontSize: '18px' }}>{locale.flag}</span>}
              <span style={{ flex: 1 }}>{locale.name} ({locale.code})</span>
              <span style={{ fontSize: '12px' }}>Current page</span>
            </div>
          )
        }

        if (row.kind === 'translated') {
          return (
            <div
              key={idStr}
              className={adminUIStyles.optionRow}
            >
              {locale.flag && <span style={{ fontSize: '18px' }}>{locale.flag}</span>}
              <span style={{ flex: 1 }}>{locale.name} ({locale.code})</span>
              <a
                href={`/admin/collections/pages/${row.pageId}`}
                style={{
                  fontSize: '12px',
                  color: 'var(--theme-success-500)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Already translated — Open
              </a>
            </div>
          )
        }

        return (
          <label
            key={idStr}
            className={[
              adminUIStyles.optionRow,
              adminUIStyles.optionButton,
              selectedLocaleId === idStr ? adminUIStyles.optionSelected : '',
            ].filter(Boolean).join(' ')}
          >
            <input
              type="radio"
              name="targetLocale"
              value={idStr}
              checked={selectedLocaleId === idStr}
              onChange={(e) => onSelect(e.target.value)}
              style={{ display: 'none' }}
            />
            {locale.flag && <span style={{ fontSize: '18px' }}>{locale.flag}</span>}
            <span style={{ fontWeight: 500 }}>{locale.name}</span>
            <span style={{ color: 'var(--theme-elevation-400)', fontSize: '12px' }}>({locale.code})</span>
          </label>
        )
      })}
    </div>
  )
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  )
}

function ModalActions({
  onCancel,
  onCreate,
  canCreate,
  loading,
}: {
  onCancel: () => void
  onCreate: () => void
  canCreate: boolean
  loading: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
      <AdminButton
        type="button"
        onClick={onCancel}
      >
        Cancel
      </AdminButton>
      <AdminButton
        type="button"
        onClick={onCreate}
        disabled={!canCreate}
        tone="primary"
      >
        {loading ? 'Creating…' : 'Create translation'}
      </AdminButton>
    </div>
  )
}
