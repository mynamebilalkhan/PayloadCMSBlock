import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { randomUUID } from 'crypto'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: Locale System
 *
 * Up:
 *   1. Create the default "en" locale
 *   2. Assign locale + translationGroupId to all existing pages
 *   3. Seed header-locales + footer-locales from existing globals
 *   4. Add compound DB index: pages(slug, locale_id)
 *   5. Add performance indexes
 *
 * Down:
 *   Removes the indexes (data is left intact — destructive rollback is not safe in prod).
 */

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // ── Step 1: Create default English locale ─────────────────────────────────
  payload.logger.info('Creating default English locale...')

  const existingLocales = await payload.find({
    collection: 'locales',
    limit: 1,
    req,
  })

  let defaultLocaleId: string | number

  if (existingLocales.totalDocs > 0) {
    const existing = existingLocales.docs.find((l) => l.code === 'en') ?? existingLocales.docs[0]
    defaultLocaleId = existing.id
    payload.logger.info(`Using existing locale: ${existing.code} (id: ${defaultLocaleId})`)
  } else {
    const defaultLocale = await payload.create({
      collection: 'locales',
      data: {
        name: 'English',
        code: 'en',
        isDefault: true,
        isEnabled: true,
        isRTL: false,
        sortOrder: 0,
        flag: '🇬🇧',
      },
      req,
    })
    defaultLocaleId = defaultLocale.id
    payload.logger.info(`Created default locale: en (id: ${defaultLocaleId})`)
  }

  // ── Step 2: Assign locale + translationGroupId to all existing pages ──────
  payload.logger.info('Assigning default locale to existing pages...')

  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await payload.find({
      collection: 'pages',
      limit: 50,
      page,
      req,
    })

    for (const doc of result.docs) {
      const needsLocale = !doc.locale
      const needsGroupId = !doc.translationGroupId

      if (needsLocale || needsGroupId) {
        await payload.update({
          collection: 'pages',
          id: doc.id,
          data: {
            ...(needsLocale ? { locale: defaultLocaleId } : {}),
            ...(needsGroupId ? { translationGroupId: randomUUID() } : {}),
          },
          req,
        })
      }
    }

    hasMore = result.hasNextPage
    page++
  }

  payload.logger.info('All pages updated with default locale.')

  // ── Step 3: Seed header-locales from existing header global ───────────────
  payload.logger.info('Seeding header-locales from existing header global...')

  const existingHeaderLocale = await payload.find({
    collection: 'header-locales',
    where: { locale: { equals: defaultLocaleId } },
    limit: 1,
    req,
  })

  if (existingHeaderLocale.totalDocs === 0) {
    try {
      // @ts-expect-error header global was removed; migration references legacy data
      const headerGlobal = await payload.findGlobal({ slug: 'header', depth: 1, req })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload.create as any)({
        collection: 'header-locales',
        data: {
          locale: defaultLocaleId,
          // @ts-expect-error header global was removed
          logo: (headerGlobal.logo as { id?: string | number } | null)?.id ?? null,
          // @ts-expect-error header global was removed
          navigationItems: (headerGlobal.navigationItems as unknown[]) ?? [],
          // @ts-expect-error header global was removed
          ctaButton: (headerGlobal.ctaButton as Record<string, unknown>) ?? {},
          // @ts-expect-error header global was removed
          stickyHeader: (headerGlobal.stickyHeader as boolean) ?? true,
        },
        req,
      })
      payload.logger.info('Created header-locales record for en.')
    } catch (err) {
      payload.logger.warn('Could not seed header-locales (header global may be empty): ' + String(err))
    }
  } else {
    payload.logger.info('header-locales for en already exists — skipping.')
  }

  // ── Step 4: Seed footer-locales from existing footer global ───────────────
  payload.logger.info('Seeding footer-locales from existing footer global...')

  const existingFooterLocale = await payload.find({
    collection: 'footer-locales',
    where: { locale: { equals: defaultLocaleId } },
    limit: 1,
    req,
  })

  if (existingFooterLocale.totalDocs === 0) {
    try {
      // @ts-expect-error footer global was removed; migration references legacy data
      const footerGlobal = await payload.findGlobal({ slug: 'footer', depth: 1, req })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload.create as any)({
        collection: 'footer-locales',
        data: {
          locale: defaultLocaleId,
          // @ts-expect-error footer global was removed
          logo: (footerGlobal.logo as { id?: string | number } | null)?.id ?? null,
          // @ts-expect-error footer global was removed
          columns: (footerGlobal.columns as unknown[]) ?? [],
          // @ts-expect-error footer global was removed
          copyright: (footerGlobal.copyright as string) ?? '',
          // @ts-expect-error footer global was removed
          socialLinks: (footerGlobal.socialLinks as unknown[]) ?? [],
        },
        req,
      })
      payload.logger.info('Created footer-locales record for en.')
    } catch (err) {
      payload.logger.warn('Could not seed footer-locales (footer global may be empty): ' + String(err))
    }
  } else {
    payload.logger.info('footer-locales for en already exists — skipping.')
  }

  // ── Step 5: Add compound and performance indexes ───────────────────────────
  payload.logger.info('Adding DB indexes...')

  try {
    // Compound unique index: slug + locale on pages
    await payload.db.drizzle.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_locale_unique ON pages (slug, locale_id)`
    )

    // Performance indexes
    await payload.db.drizzle.execute(
      sql`CREATE INDEX IF NOT EXISTS pages_translation_group_idx ON pages (translation_group_id)`
    )
    await payload.db.drizzle.execute(
      sql`CREATE INDEX IF NOT EXISTS pages_locale_idx ON pages (locale_id)`
    )

    payload.logger.info('DB indexes created successfully.')
  } catch (err) {
    payload.logger.warn('Index creation failed (may already exist): ' + String(err))
  }

  payload.logger.info('✓ Locale system migration complete.')
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Rolling back locale system indexes...')

  try {
    await payload.db.drizzle.execute(
      sql`DROP INDEX IF EXISTS pages_slug_locale_unique`
    )
    await payload.db.drizzle.execute(
      sql`DROP INDEX IF EXISTS pages_translation_group_idx`
    )
    await payload.db.drizzle.execute(
      sql`DROP INDEX IF EXISTS pages_locale_idx`
    )
    payload.logger.info('Indexes removed. Note: locale data on pages is left intact.')
  } catch (err) {
    payload.logger.warn('Index removal failed: ' + String(err))
  }
}
