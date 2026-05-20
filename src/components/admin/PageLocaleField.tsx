'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RelationshipField,
  useDocumentInfo,
  useField,
  useFormFields,
  useFormModified,
} from '@payloadcms/ui'

import { adminUIStyles } from '@/components/admin/AdminUI'
import {
  buildPageAdminUrl,
  confirmLeaveIfModified,
  isSamePage,
  localeIdFromValue,
} from '@/lib/admin/pageTranslationNav'
import { relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'
import { usePageTranslationSiblings } from '@/hooks/usePageTranslationSiblings'

type RelationshipFieldProps = React.ComponentProps<typeof RelationshipField>

/**
 * On create: normal locale relationship field.
 * On edit: locale dropdown navigates to the sibling page for that language
 * (does not retag the current document).
 */
export function PageLocaleField(props: RelationshipFieldProps) {
  return <PageLocaleFieldContent {...props} />
}

function PageLocaleFieldContent(props: RelationshipFieldProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: currentPageId } = useDocumentInfo() as any as { id?: string | number }
  const isEditing = Boolean(currentPageId)

  if (!isEditing) {
    return <RelationshipField {...props} />
  }

  return <PageLocaleSwitcher path={props.path} field={props.field} />
}

function PageLocaleSwitcher({
  path,
  field,
}: {
  path: string
  field: RelationshipFieldProps['field']
}) {
  const router = useRouter()
  const modified = useFormModified()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: currentPageId } = useDocumentInfo() as any as { id?: string | number }
  const { value: localeValue } = useField<string | number | { id: string | number }>({ path })

  const translationGroupId = useFormFields(([fields]) =>
    fields.translationGroupId?.value as string | undefined,
  )

  const currentLocaleId = localeIdFromValue(localeValue)
  const { locales, siblingByLocale, loading } = usePageTranslationSiblings(
    translationGroupId,
    currentPageId,
  )

  const [selectedId, setSelectedId] = useState(currentLocaleId ?? '')
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    setSelectedId(currentLocaleId ?? '')
  }, [currentLocaleId, currentPageId])

  const handleSwitch = useCallback(
    async (nextLocaleId: string) => {
      if (!nextLocaleId || relationshipIdsEqual(currentLocaleId, nextLocaleId)) {
        return
      }

      const sibling = siblingByLocale.get(nextLocaleId)

      if (!sibling) {
        const create = window.confirm(
          `No page exists for this locale yet. Open "Translate to…" to create it?`,
        )
        setSelectedId(currentLocaleId ?? '')
        if (create) {
          document.getElementById('translate-to-locale-btn')?.click()
        }
        return
      }

      if (isSamePage(currentPageId, sibling.id)) {
        return
      }

      if (!confirmLeaveIfModified(modified)) {
        setSelectedId(currentLocaleId ?? '')
        return
      }

      setSwitching(true)
      router.push(buildPageAdminUrl(sibling.id))
    },
    [currentLocaleId, currentPageId, modified, router, siblingByLocale],
  )

  const label = typeof field?.label === 'string' ? field.label : 'Locale'
  const description =
    typeof field?.admin?.description === 'string'
      ? field.admin.description
      : 'Switch language to open that translation. Each locale is a separate page.'

  return (
    <div className="field-type relationship">
      <label className="field-label" htmlFor={`${path}-locale-switcher`}>
        {label}
        {field?.required && <span className="required">*</span>}
      </label>
      <select
        id={`${path}-locale-switcher`}
        value={selectedId}
        disabled={loading || switching || !translationGroupId}
        onChange={(e) => {
          const next = e.target.value
          setSelectedId(next)
          void handleSwitch(next)
        }}
        className={adminUIStyles.select}
        style={{ cursor: loading || switching ? 'wait' : 'pointer' }}
      >
        {locales.length === 0 && (
          <option value={selectedId}>{loading ? 'Loading…' : 'No locales'}</option>
        )}
        {locales.map((locale) => {
          const hasTranslation = siblingByLocale.has(String(locale.id))
          const isCurrent = relationshipIdsEqual(currentLocaleId, locale.id)
          return (
            <option key={String(locale.id)} value={String(locale.id)}>
              {locale.flag ? `${locale.flag} ` : ''}
              {locale.name} ({locale.code})
              {isCurrent ? ' — current' : hasTranslation ? '' : ' — not created'}
            </option>
          )
        })}
      </select>
      <p className="field-description" style={{ marginTop: 6 }}>
        {description}
      </p>
      {!translationGroupId && (
        <p style={{ fontSize: '12px', color: 'var(--theme-warning-500)', marginTop: 4 }}>
          Save this page once to enable translation switching.
        </p>
      )}
    </div>
  )
}
