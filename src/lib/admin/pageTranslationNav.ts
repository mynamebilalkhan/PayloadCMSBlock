import { relationshipIdsEqual } from '@/lib/payload/coerceRelationshipId'

export interface LocaleOption {
  id: string | number
  name: string
  code: string
  flag?: string | null
}

export interface SiblingPage {
  id: string | number
  locale: string | number | null
}

export async function fetchTranslationSiblings(
  translationGroupId: string,
): Promise<SiblingPage[]> {
  const res = await fetch(
    `/api/pages?where[translationGroupId][equals]=${encodeURIComponent(translationGroupId)}&depth=0&limit=50`,
    { credentials: 'same-origin' },
  )
  if (!res.ok) {
    return []
  }
  const text = await res.text()
  if (!text.trim()) {
    return []
  }
  try {
    const data = JSON.parse(text) as { docs?: SiblingPage[] }
    return data.docs ?? []
  } catch {
    return []
  }
}

export async function fetchEnabledLocales(): Promise<LocaleOption[]> {
  const res = await fetch(
    '/api/locales?where[isEnabled][equals]=true&limit=100&sort=sortOrder',
    { credentials: 'same-origin' },
  )
  if (!res.ok) {
    return []
  }
  const text = await res.text()
  if (!text.trim()) {
    return []
  }
  try {
    const data = JSON.parse(text) as { docs?: LocaleOption[] }
    return data.docs ?? []
  } catch {
    return []
  }
}

export function siblingsByLocaleId(pages: SiblingPage[]): Map<string, SiblingPage> {
  const map = new Map<string, SiblingPage>()
  for (const page of pages) {
    if (page.locale != null) {
      map.set(String(page.locale), page)
    }
  }
  return map
}

export function confirmLeaveIfModified(modified: boolean): boolean {
  if (!modified) return true
  return window.confirm('You have unsaved changes on this page. Leave without saving?')
}

export function buildPageAdminUrl(pageId: string | number): string {
  return `/admin/collections/pages/${pageId}`
}

export function localeIdFromValue(
  value: string | number | { id: string | number } | null | undefined,
): string | null {
  if (value == null) return null
  if (typeof value === 'object' && 'id' in value) return String(value.id)
  return String(value)
}

export function isSamePage(
  currentPageId: string | number | undefined,
  targetPageId: string | number,
): boolean {
  return relationshipIdsEqual(currentPageId, targetPageId)
}
