import type { Payload, PayloadRequest, TypedUser } from 'payload'

import {
  coerceRelationshipId,
  relationshipIdsEqual,
} from '@/lib/payload/coerceRelationshipId'
import {
  sampleArrayRowIds,
  sanitizePageCopyForCreate,
} from '@/lib/admin/sanitizePageCopyForCreate'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DuplicatePageSuccess = {
  ok: true
  pageId: string | number
  slug: string
}

export type DuplicatePageFailure = {
  ok: false
  status: 400 | 404 | 409
  error: string
  existingId?: string | number
}

export type DuplicatePageResult = DuplicatePageSuccess | DuplicatePageFailure

interface LocaleDoc {
  id: string | number
  name: string
  code: string
  isEnabled?: boolean
}

// ─── Core logic ───────────────────────────────────────────────────────────────

export async function duplicatePageForLocale({
  payload,
  user,
  pageId,
  targetLocaleId,
}: {
  payload: Payload
  user: TypedUser
  pageId: string | number
  targetLocaleId: string | number
}): Promise<DuplicatePageResult> {
  const req: Partial<PayloadRequest> = { user }
  const coercedPageId = coerceRelationshipId(pageId)
  const coercedTargetLocaleId = coerceRelationshipId(targetLocaleId)

  let sourcePage
  try {
    sourcePage = await payload.findByID({
      collection: 'pages',
      id: coercedPageId,
      depth: 0,
      req,
      overrideAccess: false,
      user,
    })
  } catch {
    return { ok: false, status: 404, error: 'Source page not found.' }
  }

  const translationGroupId = sourcePage.translationGroupId as string | null
  if (!translationGroupId) {
    return {
      ok: false,
      status: 400,
      error: 'Source page has no translation group ID. Save the page first.',
    }
  }

  const sourceLocaleId = sourcePage.locale as string | number | null | undefined
  if (relationshipIdsEqual(sourceLocaleId, coercedTargetLocaleId)) {
    return {
      ok: false,
      status: 400,
      error: 'Cannot translate into the same locale as this page.',
    }
  }

  const localeResult = await payload.find({
    collection: 'locales',
    where: { id: { equals: coercedTargetLocaleId } },
    limit: 1,
    req,
    overrideAccess: false,
    user,
  })

  const targetLocale = localeResult.docs[0] as LocaleDoc | undefined
  if (!targetLocale) {
    return { ok: false, status: 404, error: 'Target locale not found.' }
  }

  if (targetLocale.isEnabled === false) {
    return {
      ok: false,
      status: 400,
      error: `Locale "${targetLocale.name}" is disabled. Enable it before creating translations.`,
    }
  }

  const targetLocaleIdNormalized = coerceRelationshipId(targetLocale.id)

  const existing = await payload.find({
    collection: 'pages',
    where: {
      translationGroupId: { equals: translationGroupId },
      locale: { equals: targetLocaleIdNormalized },
    },
    limit: 1,
    req,
    overrideAccess: false,
    user,
  })

  if (existing.totalDocs > 0) {
    return {
      ok: false,
      status: 409,
      error: `A "${targetLocale.name}" translation already exists for this page.`,
      existingId: existing.docs[0]!.id,
    }
  }

  const baseSlug = sourcePage.slug as string
  let slug = baseSlug

  const slugConflict = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
      locale: { equals: targetLocaleIdNormalized },
    },
    limit: 1,
    req,
    overrideAccess: false,
    user,
  })

  if (slugConflict.totalDocs > 0) {
    if (baseSlug === '/') {
      return {
        ok: false,
        status: 409,
        error: `A homepage already exists for "${targetLocale.name}". Open it or change its slug before duplicating.`,
        existingId: slugConflict.docs[0]!.id,
      }
    }
    slug = `${baseSlug}-${targetLocale.code}`
  }

  const beforeSanitize = sampleArrayRowIds({
    dbLayout: sourcePage.dbLayout,
    contentBlocks: sourcePage.contentBlocks,
  })
  const { dbLayout, contentBlocks } = sanitizePageCopyForCreate({
    dbLayout: sourcePage.dbLayout,
    contentBlocks: sourcePage.contentBlocks,
  })
  const afterSanitize = sampleArrayRowIds({ dbLayout, contentBlocks })

  // #region agent log
  fetch('http://127.0.0.1:7778/ingest/5ad13a7a-4246-4729-b973-289d8d91b3b5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3dd5e9' },
    body: JSON.stringify({
      sessionId: '3dd5e9',
      hypothesisId: 'A',
      location: 'duplicatePageForLocale.ts:before-create',
      message: 'duplicate create payload ids',
      data: {
        pageId: coercedPageId,
        targetLocaleId: targetLocaleIdNormalized,
        beforeSanitize,
        afterSanitize,
      },
      timestamp: Date.now(),
      runId: 'pre-fix',
    }),
  }).catch(() => {})
  // #endregion

  let newPage
  try {
    newPage = await payload.create({
      collection: 'pages',
      data: {
        title: sourcePage.title,
        slug,
        status: 'draft',
        locale: targetLocaleIdNormalized as number,
        translationGroupId,
        seo: sourcePage.seo,
        dbLayout,
        contentBlocks,
      },
      req,
      overrideAccess: false,
      user,
    })
    // #region agent log
    fetch('http://127.0.0.1:7778/ingest/5ad13a7a-4246-4729-b973-289d8d91b3b5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3dd5e9' },
      body: JSON.stringify({
        sessionId: '3dd5e9',
        hypothesisId: 'A',
        location: 'duplicatePageForLocale.ts:after-create',
        message: 'duplicate create success',
        data: { newPageId: newPage.id, slug: newPage.slug },
        timestamp: Date.now(),
        runId: 'pre-fix',
      }),
    }).catch(() => {})
    // #endregion
  } catch (createErr) {
    // #region agent log
    fetch('http://127.0.0.1:7778/ingest/5ad13a7a-4246-4729-b973-289d8d91b3b5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3dd5e9' },
      body: JSON.stringify({
        sessionId: '3dd5e9',
        hypothesisId: 'A',
        location: 'duplicatePageForLocale.ts:create-error',
        message: 'duplicate create failed',
        data: {
          error: createErr instanceof Error ? createErr.message : String(createErr),
          beforeSanitize,
          afterSanitize,
        },
        timestamp: Date.now(),
        runId: 'pre-fix',
      }),
    }).catch(() => {})
    // #endregion
    throw createErr
  }

  return {
    ok: true,
    pageId: newPage.id,
    slug: newPage.slug as string,
  }
}
