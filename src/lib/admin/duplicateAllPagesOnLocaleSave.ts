import type { CollectionAfterChangeHook } from 'payload'

import { duplicateAllPagesFromDefaultLocale } from '@/lib/admin/duplicateAllPagesFromDefaultLocale'
import { shouldSeedPages } from '@/lib/admin/localeSeedPages'

type LocaleDoc = {
  id: string | number
  isDefault?: boolean | null
  isEnabled?: boolean | null
  duplicatePagesFromDefault?: boolean | null
}

export const duplicateAllPagesOnLocaleSave: CollectionAfterChangeHook<'locales'> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (!req.user) return doc

  const locale = doc as LocaleDoc
  const prev = previousDoc as LocaleDoc | undefined

  if (!shouldSeedPages({ operation, doc: locale, previousDoc: prev })) {
    return doc
  }

  const result = await duplicateAllPagesFromDefaultLocale({
    payload: req.payload,
    req,
    targetLocaleId: locale.id,
    user: req.user,
  })

  if (result.created > 0) {
    req.payload.logger.info(
      `[locales] Created ${result.created} page translation(s) from default locale for locale ${locale.id}.`,
    )
  }

  if (result.skipped > 0) {
    req.payload.logger.info(
      `[locales] Skipped ${result.skipped} page(s) — translation already existed.`,
    )
  }

  for (const { pageId, error } of result.errors) {
    req.payload.logger.warn(
      `[locales] Could not duplicate page ${pageId} for locale ${locale.id}: ${error}`,
    )
  }

  return doc
}
