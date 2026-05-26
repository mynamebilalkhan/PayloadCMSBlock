import type { CollectionAfterChangeHook, Payload, PayloadRequest } from 'payload'
import type { Page } from '../../../payload-types'

import {
  parseCreateLocalePreference,
  resolveTargetLocaleIds,
} from '@/lib/admin/createLocaleOnSave'
import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'
import { duplicatePageForLocale } from '@/lib/admin/duplicatePageForLocale'
import { SKIP_LOCALE_AUTO_CREATE } from '@/lib/admin/localePageConstants'

export { SKIP_LOCALE_AUTO_CREATE } from '@/lib/admin/localePageConstants'
// re-export for backwards compatibility if anything imported from here

type LocaleDoc = {
  id: string | number
  name: string
  code: string
  isEnabled?: boolean
}

export type PropagateLocalesResult = {
  created: number
  skipped: number
  errors: Array<{ locale: string; error: string }>
}

/**
 * Duplicate the source page for each target locale id (excludes source locale).
 */
export async function propagatePageToLocaleTargets({
  payload,
  req,
  sourcePage,
  targetLocaleIds,
}: {
  payload: Payload
  req: PayloadRequest
  sourcePage: Page
  targetLocaleIds: Array<string | number>
}): Promise<PropagateLocalesResult> {
  const sourcePageId = sourcePage.id
  const result: PropagateLocalesResult = { created: 0, skipped: 0, errors: [] }

  if (targetLocaleIds.length === 0) return result

  const localeNameById = new Map<string, string>()
  const localesResult = await payload.find({
    collection: 'locales',
    where: { isEnabled: { equals: true } },
    limit: 100,
    req,
    overrideAccess: false,
  })
  for (const locale of localesResult.docs as LocaleDoc[]) {
    localeNameById.set(String(locale.id), locale.name || locale.code)
  }

  for (const targetLocaleId of targetLocaleIds) {
    const duplicateResult = await duplicatePageForLocale({
      payload,
      user: req.user!,
      pageId: sourcePageId,
      targetLocaleId,
      req,
      sourcePage,
    })

    if (duplicateResult.ok) {
      result.created += 1
    } else if (duplicateResult.status === 409) {
      result.skipped += 1
    } else {
      result.errors.push({
        locale: localeNameById.get(String(targetLocaleId)) ?? String(targetLocaleId),
        error: duplicateResult.error,
      })
    }
  }

  return result
}

export const propagatePageToEnabledLocalesAfterCreate: CollectionAfterChangeHook<'pages'> = async ({
  doc,
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc
  if (req.context?.[SKIP_LOCALE_AUTO_CREATE]) return doc
  if (!req.user) return doc

  const preference = parseCreateLocalePreference(
    (data as { createLocaleOnSave?: unknown } | undefined)?.createLocaleOnSave ??
      doc.createLocaleOnSave ??
      req.context?.pendingCreateLocaleOnSave,
    (data as { createTranslationsForAllLocales?: boolean } | undefined)
      ?.createTranslationsForAllLocales ??
      (doc.createTranslationsForAllLocales as boolean | null | undefined),
  )

  if (preference.mode === 'none') return doc

  const sourceLocaleId = coerceRelationshipId(doc.locale as string | number)
  const enabledResult = await req.payload.find({
    collection: 'locales',
    where: { isEnabled: { equals: true } },
    limit: 100,
    sort: 'sortOrder',
    req,
    overrideAccess: false,
  })
  const enabledIds = (enabledResult.docs as LocaleDoc[]).map((l) => l.id)
  const targetIds = resolveTargetLocaleIds(preference, enabledIds, sourceLocaleId)

  if (targetIds.length === 0) return doc

  const result = await propagatePageToLocaleTargets({
    payload: req.payload,
    req,
    sourcePage: doc as Page,
    targetLocaleIds: targetIds,
  })

  if (result.created > 0) {
    req.payload.logger.info(
      `[pages] Created ${result.created} locale variant(s) for page ${doc.id}.`,
    )
  }

  for (const { locale, error } of result.errors) {
    req.payload.logger.warn(
      `[pages] Could not create locale variant for "${locale}" (page ${doc.id}): ${error}`,
    )
  }

  return doc
}
