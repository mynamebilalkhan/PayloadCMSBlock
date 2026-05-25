'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FieldDescription,
  FieldLabel,
  useDocumentInfo,
  useField,
  useFormFields,
} from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'
import type { CreateLocaleOnSave } from '@/lib/admin/createLocaleOnSave'
import { relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'
import { fetchEnabledLocales, localeIdFromValue, type LocaleOption } from '@/lib/admin/pageTranslationNav'

function parseValue(raw: unknown): CreateLocaleOnSave {
  if (!raw || typeof raw !== 'object') return { mode: 'none' }
  const o = raw as Record<string, unknown>
  if (o.mode === 'all') return { mode: 'all' }
  if (o.mode === 'selected' && Array.isArray(o.localeIds)) {
    return { mode: 'selected', localeIds: o.localeIds as Array<string | number> }
  }
  return { mode: 'none' }
}

export const CreateLocaleVariantsField: JSONFieldClientComponent = (props) => (
  <ClientOnlyAdminField>
    <CreateLocaleVariantsFieldContent {...props} />
  </ClientOnlyAdminField>
)

const CreateLocaleVariantsFieldContent: JSONFieldClientComponent = ({ field, path }) => {
  const { id } = useDocumentInfo()
  const { value, setValue } = useField<CreateLocaleOnSave>({ path })
  const currentLocale = useFormFields(([fields]) => fields.locale?.value)

  const [open, setOpen] = useState(false)
  const [locales, setLocales] = useState<LocaleOption[]>([])
  const [loading, setLoading] = useState(true)

  const preference = useMemo(() => parseValue(value), [value])
  const currentLocaleId = localeIdFromValue(
    currentLocale as string | number | { id: string | number } | null | undefined,
  )

  const otherLocales = useMemo(
    () => locales.filter((l) => !relationshipIdsEqual(l.id, currentLocaleId)),
    [locales, currentLocaleId],
  )

  const allChecked = preference.mode === 'all'
  const selectedSet = useMemo(() => {
    if (preference.mode !== 'selected') return new Set<string>()
    return new Set(preference.localeIds.map((id) => String(id)))
  }, [preference])

  useEffect(() => {
    if (id != null && id !== '') return
    let cancelled = false
    setLoading(true)
    fetchEnabledLocales()
      .then((docs) => {
        if (!cancelled) setLocales(docs)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const setAll = useCallback(
    (checked: boolean) => {
      setValue(checked ? { mode: 'all' } : { mode: 'none' })
    },
    [setValue],
  )

  const toggleLocale = useCallback(
    (localeId: string | number, checked: boolean) => {
      const key = String(localeId)
      const next = new Set(selectedSet)
      if (checked) next.add(key)
      else next.delete(key)
      if (next.size === 0) {
        setValue({ mode: 'none' })
        return
      }
      setValue({
        mode: 'selected',
        localeIds: [...next].map((k) => {
          const match = otherLocales.find((l) => String(l.id) === k)
          return match?.id ?? k
        }),
      })
    },
    [otherLocales, selectedSet, setValue],
  )

  if (id != null && id !== '') {
    return null
  }

  const fieldPath = path
  const description =
    field.admin?.description ??
    'Optionally create draft copies in other languages when you save this page.'

  return (
    <div className="field-type create-locale-variants-field" style={{ marginBottom: '1rem' }}>
      <FieldLabel label={field.label ?? 'Create translations'} path={fieldPath} required={false} />
      <div className="field-type__wrap">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s, 4px)',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <span>
            {allChecked
              ? 'All enabled locales'
              : preference.mode === 'selected' && selectedSet.size > 0
                ? `${selectedSet.size} locale(s) selected`
                : 'Choose locales…'}
          </span>
          <span aria-hidden style={{ opacity: 0.6 }}>
            {open ? '▴' : '▾'}
          </span>
        </button>

        {open && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-s, 4px)',
              background: 'var(--theme-elevation-50, #f9fafb)',
            }}
          >
            {loading ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500)', margin: 0 }}>
                Loading locales…
              </p>
            ) : otherLocales.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500)', margin: 0 }}>
                No other enabled locales. Add more under Site Settings → Locales.
              </p>
            ) : (
              <>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.625rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => setAll(e.target.checked)}
                  />
                  All enabled locales
                </label>
                <div
                  style={{
                    borderTop: '1px solid var(--theme-elevation-150)',
                    paddingTop: '0.625rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    opacity: allChecked ? 0.45 : 1,
                    pointerEvents: allChecked ? 'none' : 'auto',
                  }}
                >
                  {otherLocales.map((locale) => (
                    <label
                      key={String(locale.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                        cursor: allChecked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={allChecked}
                        checked={allChecked || selectedSet.has(String(locale.id))}
                        onChange={(e) => toggleLocale(locale.id, e.target.checked)}
                      />
                      <span>
                        {locale.flag ? `${locale.flag} ` : ''}
                        {locale.name}
                        <span style={{ color: 'var(--theme-elevation-500)', marginLeft: '0.25rem' }}>
                          ({locale.code})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <FieldDescription description={description} path={fieldPath} />
      </div>
    </div>
  )
}
