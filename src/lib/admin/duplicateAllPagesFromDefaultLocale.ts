import type { Payload, PayloadRequest, TypedUser } from 'payload'
import type { Page } from '../../../payload-types'

import { duplicatePageForLocale } from '@/lib/admin/duplicatePageForLocale'
import { getDefaultLocaleId } from '@/lib/admin/getDefaultLocaleId'
import {
  coerceRelationshipId,
  relationshipIdsEqual,
} from '@/lib/payload/coerceRelationshipId'

export type DuplicateAllPagesResult = {
  created: number
  skipped: number
  errors: Array<{ pageId: string | number; error: string }>
}

const PAGE_BATCH = 100

/**
 * For a newly added (or re-enabled) locale, create draft copies of every page
 * that exists in the default locale and does not yet have a translation.
 */
export async function duplicateAllPagesFromDefaultLocale({
  payload,
  req,
  targetLocaleId,
  user,
}: {
  payload: Payload
  req: PayloadRequest
  targetLocaleId: string | number
  user: TypedUser
}): Promise<DuplicateAllPagesResult> {
  const result: DuplicateAllPagesResult = { created: 0, skipped: 0, errors: [] }
  const coercedTargetId = coerceRelationshipId(targetLocaleId)

  const defaultLocaleId = await getDefaultLocaleId(payload, req)
  if (defaultLocaleId == null) {
    payload.logger.warn('[locales] No enabled default locale — skipping page duplication.')
    return result
  }

  if (relationshipIdsEqual(defaultLocaleId, coercedTargetId)) {
    return result
  }

  let page = 1
  while (true) {
    const pagesResult = await payload.find({
      collection: 'pages',
      where: { locale: { equals: coerceRelationshipId(defaultLocaleId) } },
      limit: PAGE_BATCH,
      page,
      depth: 0,
      sort: 'title',
      req,
      overrideAccess: false,
      user,
    })

    if (pagesResult.docs.length === 0) break

    for (const sourcePage of pagesResult.docs as Page[]) {
      const duplicateResult = await duplicatePageForLocale({
        payload,
        user,
        pageId: sourcePage.id,
        targetLocaleId: coercedTargetId,
        req,
        sourcePage,
      })

      if (duplicateResult.ok) {
        result.created += 1
      } else if (duplicateResult.status === 409) {
        result.skipped += 1
      } else {
        result.errors.push({
          pageId: sourcePage.id,
          error: duplicateResult.error,
        })
      }
    }

    if (!pagesResult.hasNextPage) break
    page += 1
  }

  return result
}
