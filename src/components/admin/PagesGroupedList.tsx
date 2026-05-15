import React from 'react'
import type { ListViewServerProps } from 'payload'
import { Gutter } from '@payloadcms/ui'

import {
  groupPagesByTranslation,
  type LocaleDoc,
  type PageDoc,
} from '@/lib/admin/groupPagesByTranslation'
import { PagesGroupedListTable } from '@/components/admin/PagesGroupedListTable'

/**
 * Custom Pages list: one row per logical page (translation group),
 * with locale chips for each translation variant.
 */
export async function PagesGroupedList(props: ListViewServerProps) {
  const { payload, user, Description, hasCreatePermission, newDocumentURL } = props

  const [pagesResult, localesResult] = await Promise.all([
    payload.find({
      collection: 'pages',
      depth: 1,
      limit: 1000,
      sort: '-updatedAt',
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'locales',
      where: { isEnabled: { equals: true } },
      sort: 'sortOrder',
      limit: 100,
      user,
      overrideAccess: false,
    }),
  ])

  const enabledLocales = (localesResult.docs ?? []) as LocaleDoc[]
  const groups = groupPagesByTranslation(
    (pagesResult.docs ?? []) as PageDoc[],
    enabledLocales,
  )

  return (
    <Gutter className="collection-list collection-list--pages-grouped">
      {Description}
      <p
        style={{
          margin: '0 0 20px',
          fontSize: '13px',
          color: 'var(--theme-elevation-500)',
          maxWidth: 640,
        }}
      >
        Each row is one page across all locales. Open a locale chip to edit that translation, or
        click <strong>+</strong> to create a missing one.
      </p>
      <PagesGroupedListTable
        groups={groups}
        locales={enabledLocales}
        hasCreatePermission={hasCreatePermission}
        newDocumentURL={newDocumentURL}
      />
    </Gutter>
  )
}
