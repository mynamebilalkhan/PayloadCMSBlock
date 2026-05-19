import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getDefaultLocale } from '@/lib/locale'

/**
 * GET /api/admin/page-sibling?translationGroupId=xxx
 *
 * Returns the default locale sibling of a page for translation reference.
 * Used by the TranslationReferencePanel to show original content side-by-side.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const translationGroupId = searchParams.get('translationGroupId')

    if (!translationGroupId) {
      return NextResponse.json(
        { error: 'translationGroupId is required' },
        { status: 400 }
      )
    }

    // Get default locale
    const defaultLocale = await getDefaultLocale()

    // Find the default locale sibling
    const result = await payload.find({
      collection: 'pages',
      where: {
        translationGroupId: { equals: translationGroupId },
        locale: { equals: defaultLocale.id },
      },
      depth: 2,
      limit: 1,
    })

    const sibling = result.docs[0]

    if (!sibling) {
      return NextResponse.json(
        { error: 'No default locale sibling found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      page: {
        id: sibling.id,
        title: sibling.title,
        slug: sibling.slug,
        seo: sibling.seo,
        dbLayout: sibling.dbLayout,
        contentBlocks: sibling.contentBlocks,
        locale: sibling.locale,
      },
      defaultLocale: {
        id: defaultLocale.id,
        code: defaultLocale.code,
        name: defaultLocale.name,
        flag: defaultLocale.flag,
      },
    })
  } catch (err) {
    console.error('[page-sibling]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
