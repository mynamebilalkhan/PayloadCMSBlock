import type { CollectionAfterChangeHook, Payload, PayloadRequest } from 'payload'

import { mergeDbLayoutStructure } from '@/lib/admin/mergeDbLayoutStructure'
import {
  SKIP_LOCALE_AUTO_CREATE,
  SKIP_LOCALE_STRUCTURE_SYNC,
} from '@/lib/admin/localePageConstants'
import { coerceRelationshipId, relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'

type PageDoc = {
  id: string | number
  locale?: string | number | null
  translationGroupId?: string | null
  autoSyncStructureToLocales?: boolean | null
  dbLayout?: unknown
}

async function getDefaultLocaleId(payload: Payload, req: PayloadRequest): Promise<string | number | null> {
  const result = await payload.find({
    collection: 'locales',
    where: {
      isDefault: { equals: true },
      isEnabled: { equals: true },
    },
    limit: 1,
    req,
    overrideAccess: false,
  })
  const doc = result.docs[0] as { id?: string | number } | undefined
  return doc?.id ?? null
}

export async function syncStructureToLocaleSiblings({
  payload,
  req,
  sourcePage,
}: {
  payload: Payload
  req: PayloadRequest
  sourcePage: PageDoc
}): Promise<{ updated: number; skipped: number }> {
  const translationGroupId = sourcePage.translationGroupId
  if (!translationGroupId) return { updated: 0, skipped: 0 }

  const sourceLocaleId = coerceRelationshipId(sourcePage.locale as string | number)
  const sourceLayout = Array.isArray(sourcePage.dbLayout) ? sourcePage.dbLayout : []

  const siblings = await payload.find({
    collection: 'pages',
    where: {
      translationGroupId: { equals: translationGroupId },
      locale: { not_equals: sourceLocaleId },
    },
    depth: 0,
    limit: 50,
    req,
    overrideAccess: false,
  })

  let updated = 0
  let skipped = 0

  for (const sibling of siblings.docs as PageDoc[]) {
    const targetLayout = Array.isArray(sibling.dbLayout) ? sibling.dbLayout : []
    const merged = mergeDbLayoutStructure(sourceLayout, targetLayout)

    const prevJson = JSON.stringify(targetLayout)
    const nextJson = JSON.stringify(merged)
    if (prevJson === nextJson) {
      skipped += 1
      continue
    }

    await payload.update({
      collection: 'pages',
      id: sibling.id,
      data: {
        dbLayout: merged as unknown as undefined,
      },
      req: {
        ...req,
        context: {
          ...(req.context ?? {}),
          [SKIP_LOCALE_STRUCTURE_SYNC]: true,
          [SKIP_LOCALE_AUTO_CREATE]: true,
        },
      },
      overrideAccess: false,
    })
    updated += 1
  }

  return { updated, skipped }
}

export const syncStructureToLocaleSiblingsAfterChange: CollectionAfterChangeHook<'pages'> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (req.context?.[SKIP_LOCALE_STRUCTURE_SYNC]) return doc
  if (operation !== 'update') return doc
  if (!req.user) return doc
  if (!doc.autoSyncStructureToLocales) return doc

  const defaultLocaleId = await getDefaultLocaleId(req.payload, req)
  if (defaultLocaleId == null) return doc
  if (!relationshipIdsEqual(doc.locale, defaultLocaleId)) return doc

  const prevLayout = JSON.stringify(previousDoc?.dbLayout ?? [])
  const nextLayout = JSON.stringify(doc.dbLayout ?? [])
  if (prevLayout === nextLayout) return doc

  let sourcePage = doc as PageDoc
  try {
    sourcePage = (await req.payload.findByID({
      collection: 'pages',
      id: doc.id,
      depth: 0,
      req,
      overrideAccess: false,
    })) as PageDoc
  } catch {
    sourcePage = doc as PageDoc
  }

  const { updated, skipped } = await syncStructureToLocaleSiblings({
    payload: req.payload,
    req,
    sourcePage,
  })

  if (updated > 0) {
    req.payload.logger.info(
      `[pages] Auto-synced block structure from default page ${doc.id} to ${updated} locale(s).`,
    )
  }
  if (skipped > 0 && updated === 0) {
    req.payload.logger.info(
      `[pages] Auto-sync: ${skipped} locale(s) already matched structure for page ${doc.id}.`,
    )
  }

  return doc
}
