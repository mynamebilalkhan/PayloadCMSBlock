import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { randomUUID } from 'crypto'

/**
 * POST /api/admin/duplicate-page-locale
 *
 * Duplicates an existing page document for a target locale.
 * The new page inherits the same translationGroupId, title, dbLayout, and
 * contentBlocks — slug is adjusted if a conflict exists.
 *
 * Body: { pageId: string | number, targetLocaleId: string | number }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as { pageId?: string | number; targetLocaleId?: string | number }
    const { pageId, targetLocaleId } = body

    if (!pageId || !targetLocaleId) {
      return NextResponse.json(
        { error: 'pageId and targetLocaleId are required.' },
        { status: 400 },
      )
    }

    // Fetch the source page
    const sourcePage = await payload.findByID({
      collection: 'pages',
      id: pageId,
      depth: 1,
    })

    if (!sourcePage) {
      return NextResponse.json({ error: 'Source page not found.' }, { status: 404 })
    }

    // Fetch the target locale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetLocale = await (payload.findByID as any)({
      collection: 'locales',
      id: targetLocaleId,
    }) as { id: string | number; name: string; code: string } | null

    if (!targetLocale) {
      return NextResponse.json({ error: 'Target locale not found.' }, { status: 404 })
    }

    // Check if a translation already exists for this group + target locale
    const translationGroupId = sourcePage.translationGroupId as string
    const existing = await payload.find({
      collection: 'pages',
      where: {
        translationGroupId: { equals: translationGroupId },
        locale: { equals: targetLocaleId },
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      return NextResponse.json(
        {
          error: `A translation in "${targetLocale.name}" already exists for this page.`,
          existingId: existing.docs[0].id,
        },
        { status: 409 },
      )
    }

    // Determine slug — append the locale code if a slug conflict exists
    const baseSlug = sourcePage.slug as string
    const localeCode = targetLocale.code as string
    let candidateSlug = baseSlug

    const slugConflict = await payload.find({
      collection: 'pages',
      where: {
        slug: { equals: candidateSlug },
        locale: { equals: targetLocaleId },
      },
      limit: 1,
    })

    if (slugConflict.totalDocs > 0) {
      candidateSlug = `${baseSlug}-${localeCode}`
    }

    // Create the new page (cast to bypass strict payload type checking on unknown fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newPage = await (payload.create as any)({
      collection: 'pages',
      data: {
        title: sourcePage.title as string,
        slug: candidateSlug,
        status: 'draft', // always start as draft
        locale: targetLocaleId,
        translationGroupId,
        seo: sourcePage.seo,
        dbLayout: sourcePage.dbLayout,
        contentBlocks: sourcePage.contentBlocks,
      },
    })

    return NextResponse.json({
      success: true,
      pageId: newPage.id,
      slug: newPage.slug,
      message: `Page duplicated for "${targetLocale.name}". Slug: ${newPage.slug}`,
    })
  } catch (err) {
    console.error('[duplicate-page-locale]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
