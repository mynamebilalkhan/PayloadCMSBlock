import type { Payload, PayloadRequest, TypedUser } from 'payload'
import type { Page } from '../../../payload-types'

import {
  coerceRelationshipId,
  relationshipIdsEqual,
} from '@/lib/payload/coerceRelationshipId'
import {
  sampleArrayRowIds,
  sanitizePageCopyForCreate,
} from '@/lib/admin/sanitizePageCopyForCreate'
import { SKIP_LOCALE_AUTO_CREATE } from '@/lib/admin/localePageConstants'

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
  req: parentReq,
  sourcePage: sourcePageFromCaller,
}: {
  payload: Payload
  user: TypedUser
  pageId: string | number
  targetLocaleId: string | number
  /** When set, marks nested creates so locale auto-propagate does not run again. */
  req?: Partial<PayloadRequest>
  /** Use the just-created document from afterChange to avoid a race on findByID. */
  sourcePage?: Page
}): Promise<DuplicatePageResult> {
  const req: Partial<PayloadRequest> = {
    ...parentReq,
    user: parentReq?.user ?? user,
    context: {
      ...(parentReq?.context ?? {}),
      [SKIP_LOCALE_AUTO_CREATE]: true,
    },
  }
  const coercedPageId = coerceRelationshipId(pageId)
  const coercedTargetLocaleId = coerceRelationshipId(targetLocaleId)

  let sourcePage = sourcePageFromCaller
  if (!sourcePage) {
    try {
      sourcePage = (await payload.findByID({
        collection: 'pages',
        id: coercedPageId,
        depth: 0,
        req,
        overrideAccess: false,
        user,
      })) as Page
    } catch {
      return { ok: false, status: 404, error: 'Source page not found.' }
    }
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

  // Slug stays the same across locales (URL path); only suffix on per-locale conflict.
  const baseSlug = sourcePage.slug as string
  let slug = baseSlug
  const placeholderTitle = `[${targetLocale.name}] — set page title`

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
  }) as {
    dbLayout: Page['dbLayout']
    contentBlocks: Page['contentBlocks']
  }
  const afterSanitize = sampleArrayRowIds({ dbLayout, contentBlocks })

  let newPage
  try {
    newPage = await payload.create({
      collection: 'pages',
      data: {
        title: placeholderTitle,
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
  } catch (createErr) {
    throw createErr
  }

  return {
    ok: true,
    pageId: newPage.id,
    slug: newPage.slug as string,
  }
}
