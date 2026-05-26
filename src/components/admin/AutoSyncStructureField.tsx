'use client'

import React, { useEffect, useState } from 'react'
import { CheckboxField, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import type { CheckboxFieldClientComponent } from 'payload'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'
import { relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'
import { localeIdFromValue } from '@/lib/admin/pageTranslationNav'

export const AutoSyncStructureField: CheckboxFieldClientComponent = (props) => (
  <ClientOnlyAdminField>
    <AutoSyncStructureFieldContent {...props} />
  </ClientOnlyAdminField>
)

const AutoSyncStructureFieldContent: CheckboxFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const currentLocale = useFormFields(([fields]) => fields.locale?.value)
  const [defaultLocaleId, setDefaultLocaleId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/locales?where[isDefault][equals]=true&where[isEnabled][equals]=true&limit=1', {
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data: { docs?: Array<{ id: string | number }> }) => {
        if (!cancelled && data.docs?.[0]) {
          setDefaultLocaleId(String(data.docs[0].id))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const currentLocaleId = localeIdFromValue(
    currentLocale as string | number | { id: string | number } | null | undefined,
  )

  if (defaultLocaleId == null || currentLocaleId == null) {
    return null
  }

  if (!relationshipIdsEqual(currentLocaleId, defaultLocaleId)) {
    return null
  }

  return (
    <CheckboxField
      {...props}
      field={{
        ...props.field,
        admin: {
          ...props.field.admin,
          description:
            props.field.admin?.description ??
            'When enabled, saving this page updates block structure on all other locale pages. Translated block content on those pages is kept.',
        },
      }}
    />
  )
}
