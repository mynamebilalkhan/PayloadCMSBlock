// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocaleDoc {
  id: string | number
  name: string
  code: string
  flag?: string | null
  isDefault?: boolean | null
  isEnabled?: boolean | null
  sortOrder?: number | null
}

export interface PageDoc {
  id: string | number
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
  translationGroupId?: string | null
  locale: string | number | LocaleDoc | null
}

export interface PageTranslationEntry {
  locale: LocaleDoc
  page?: PageDoc
}

export type PageGroupStatusSummary = 'draft' | 'published' | 'archived' | 'mixed'

export interface PageGroup {
  translationGroupId: string
  title: string
  slug: string
  primaryPageId: string | number
  updatedAt: string
  statusSummary: PageGroupStatusSummary
  translations: PageTranslationEntry[]
  isComplete: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localeId(locale: string | number | LocaleDoc | null | undefined): string | null {
  if (locale == null) return null
  if (typeof locale === 'object') return String(locale.id)
  return String(locale)
}

function parseUpdatedAt(value: string): number {
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : 0
}

function summarizeStatus(pages: PageDoc[]): PageGroupStatusSummary {
  if (pages.length === 0) return 'draft'
  const statuses = new Set(pages.map((p) => p.status))
  if (statuses.size === 1) {
    return pages[0]!.status
  }
  return 'mixed'
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Groups page documents by translationGroupId (one row per logical page).
 * Uses the default locale for title/slug when available.
 */
export function groupPagesByTranslation(
  pages: PageDoc[],
  enabledLocales: LocaleDoc[],
): PageGroup[] {
  const defaultLocale =
    enabledLocales.find((l) => l.isDefault) ?? enabledLocales[0] ?? null
  const defaultLocaleId = defaultLocale ? String(defaultLocale.id) : null

  const byGroup = new Map<string, PageDoc[]>()

  for (const page of pages) {
    const groupKey =
      page.translationGroupId?.trim() ||
      `__orphan_${String(page.id)}`
    const list = byGroup.get(groupKey) ?? []
    list.push(page)
    byGroup.set(groupKey, list)
  }

  const groups: PageGroup[] = []

  for (const [translationGroupId, groupPages] of byGroup) {
    const pagesByLocaleId = new Map<string, PageDoc>()
    for (const page of groupPages) {
      const lid = localeId(page.locale)
      if (lid) pagesByLocaleId.set(lid, page)
    }

    const primaryPage =
      (defaultLocaleId && pagesByLocaleId.get(defaultLocaleId)) ||
      groupPages.reduce((latest, page) =>
        parseUpdatedAt(page.updatedAt) >= parseUpdatedAt(latest.updatedAt) ? page : latest,
      )

    const translations: PageTranslationEntry[] = enabledLocales.map((locale) => ({
      locale,
      page: pagesByLocaleId.get(String(locale.id)),
    }))

    const isComplete = enabledLocales.every((locale) =>
      Boolean(pagesByLocaleId.get(String(locale.id))),
    )

    const latestUpdatedAt = groupPages.reduce(
      (max, page) => Math.max(max, parseUpdatedAt(page.updatedAt)),
      0,
    )

    groups.push({
      translationGroupId,
      title: primaryPage.title,
      slug: primaryPage.slug,
      primaryPageId: primaryPage.id,
      updatedAt: new Date(latestUpdatedAt || parseUpdatedAt(primaryPage.updatedAt)).toISOString(),
      statusSummary: summarizeStatus(groupPages),
      translations,
      isComplete,
    })
  }

  groups.sort((a, b) => parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt))

  return groups
}

export function filterPageGroups(
  groups: PageGroup[],
  options: { search?: string; incompleteOnly?: boolean },
): PageGroup[] {
  let result = groups

  if (options.incompleteOnly) {
    result = result.filter((g) => !g.isComplete)
  }

  const q = options.search?.trim().toLowerCase()
  if (q) {
    result = result.filter((g) => {
      if (g.title.toLowerCase().includes(q)) return true
      if (g.slug.toLowerCase().includes(q)) return true
      return g.translations.some(
        (t) =>
          t.page?.title.toLowerCase().includes(q) ||
          t.page?.slug.toLowerCase().includes(q),
      )
    })
  }

  return result
}
