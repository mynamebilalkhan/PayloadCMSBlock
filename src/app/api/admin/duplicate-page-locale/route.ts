import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { ValidationError } from 'payload'
import config from '@payload-config'

import { duplicatePageForLocale } from '@/lib/admin/duplicatePageForLocale'

/**
 * POST /api/admin/duplicate-page-locale
 *
 * Duplicates an existing page for a different locale.
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

    if (!pageId || targetLocaleId == null || targetLocaleId === '') {
      return NextResponse.json(
        { error: 'pageId and targetLocaleId are required.' },
        { status: 400 },
      )
    }

    const result = await duplicatePageForLocale({
      payload,
      user,
      pageId,
      targetLocaleId,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          ...(result.existingId != null ? { existingId: result.existingId } : {}),
        },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      pageId: result.pageId,
      slug: result.slug,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error('[duplicate-page-locale] validation:', err.data)
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    console.error('[duplicate-page-locale]', err)
    const message = err instanceof Error ? err.message : 'Internal server error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
