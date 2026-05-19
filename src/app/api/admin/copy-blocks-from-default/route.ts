import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getDefaultLocale } from '@/lib/locale'
import { normalizeBlockData } from '@/lib/blockData/normalizeBlockData'
import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'

/**
 * POST /api/admin/copy-blocks-from-default
 *
 * Copies dbLayout and contentBlocks from the default locale sibling
to the current page. Useful for translations that need the same block structure.
 * Body: { pageId: string | number }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as { pageId?: string | number; dryRun?: boolean }
    const { pageId, dryRun = false } = body

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      )
    }

    const coercedPageId = coerceRelationshipId(pageId)

    // Get the target page (current translation)
    let targetPage
    try {
      targetPage = await payload.findByID({
        collection: 'pages',
        id: coercedPageId,
        depth: 0,
      })
    } catch {
      return NextResponse.json({ error: 'Target page not found' }, { status: 404 })
    }

    const translationGroupId = targetPage.translationGroupId as string | null
    if (!translationGroupId) {
      return NextResponse.json(
        { error: 'Page has no translation group ID' },
        { status: 400 }
      )
    }

    // Get default locale
    const defaultLocale = await getDefaultLocale()

    // Check if current page is already the default locale
    const targetLocaleId = coerceRelationshipId(targetPage.locale as string | number)
    if (String(targetLocaleId) === String(defaultLocale.id)) {
      return NextResponse.json(
        { error: 'Cannot copy blocks to the same default locale page' },
        { status: 400 }
      )
    }

    // Find the default locale sibling
    const sourceResult = await payload.find({
      collection: 'pages',
      where: {
        translationGroupId: { equals: translationGroupId },
        locale: { equals: defaultLocale.id },
      },
      depth: 2,
      limit: 1,
    })

    const sourcePage = sourceResult.docs[0]
    if (!sourcePage) {
      return NextResponse.json(
        { error: 'No default locale sibling found' },
        { status: 404 }
      )
    }

    // Extract and sanitize blocks
    const sourceDbLayout = (sourcePage.dbLayout || []) as Array<{
      blockDefinition?: string | number | { id: string | number }
      blockVersion?: string | number | { id: string | number }
      data?: unknown
      instanceId?: string
      label?: string
      hidden?: boolean
      anchor?: string
    }>

    // Clean and prepare blocks for copying
    const newDbLayout = sourceDbLayout.map((block) => {
      const blockDefId = coerceRelationshipId(
        typeof block.blockDefinition === 'object' && block.blockDefinition !== null
          ? block.blockDefinition.id
          : (block.blockDefinition ?? 0)
      )
      const blockVerId = coerceRelationshipId(
        typeof block.blockVersion === 'object' && block.blockVersion !== null
          ? block.blockVersion.id
          : (block.blockVersion ?? 0)
      )

      return {
        blockDefinition: blockDefId,
        blockVersion: blockVerId,
        data: normalizeBlockData(block.data),
        instanceId: block.instanceId || crypto.randomUUID(),
        label: block.label,
        hidden: block.hidden ?? false,
        anchor: block.anchor,
      }
    })

    // Copy content blocks if they exist
    const sourceContentBlocks = (sourcePage.contentBlocks || []) as unknown[]
    const newContentBlocks = sourceContentBlocks.map((block: unknown) => {
      // Generate new IDs for content blocks to avoid conflicts
      if (typeof block === 'object' && block !== null) {
        const b = block as Record<string, unknown>
        return {
          ...b,
          id: crypto.randomUUID(),
        }
      }
      return block
    })

    // If dryRun, return blocks without saving
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        blocks: {
          dbLayout: newDbLayout,
          contentBlocks: newContentBlocks,
        },
        copied: {
          dbLayoutCount: newDbLayout.length,
          contentBlocksCount: newContentBlocks.length,
        },
      })
    }

    // Update the target page
    await payload.update({
      collection: 'pages',
      id: coercedPageId,
      data: {
        dbLayout: newDbLayout as unknown as undefined,
        contentBlocks: newContentBlocks as unknown as undefined,
      },
      user,
    })

    return NextResponse.json({
      success: true,
      copied: {
        dbLayoutCount: newDbLayout.length,
        contentBlocksCount: newContentBlocks.length,
      },
    })
  } catch (err) {
    console.error('[copy-blocks-from-default]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
