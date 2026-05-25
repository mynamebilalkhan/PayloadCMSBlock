import {
  coerceRelationshipId,
  relationshipIdsEqual,
} from '@/lib/payload/coerceRelationshipId'

export type CreateLocaleOnSave =
  | { mode: 'none' }
  | { mode: 'all' }
  | { mode: 'selected'; localeIds: Array<string | number> }

export function parseCreateLocaleOnSave(raw: unknown): CreateLocaleOnSave {
  if (!raw || typeof raw !== 'object') return { mode: 'none' }
  const o = raw as Record<string, unknown>
  if (o.mode === 'all') return { mode: 'all' }
  if (o.mode === 'selected' && Array.isArray(o.localeIds)) {
    return {
      mode: 'selected',
      localeIds: o.localeIds.filter((id) => id != null && id !== ''),
    }
  }
  return { mode: 'none' }
}

/** Legacy boolean from earlier checkbox — treat as "all". */
export function parseCreateLocalePreference(
  createLocaleOnSave: unknown,
  createTranslationsForAllLocales?: boolean | null,
): CreateLocaleOnSave {
  if (createTranslationsForAllLocales === true) return { mode: 'all' }
  return parseCreateLocaleOnSave(createLocaleOnSave)
}

export function resolveTargetLocaleIds(
  preference: CreateLocaleOnSave,
  enabledLocaleIds: Array<string | number>,
  sourceLocaleId: string | number,
): Array<string | number> {
  const source = coerceRelationshipId(sourceLocaleId)
  const others = enabledLocaleIds
    .map((id) => coerceRelationshipId(id))
    .filter((id) => !relationshipIdsEqual(id, source))

  if (preference.mode === 'none') return []
  if (preference.mode === 'all') return others
  if (preference.mode === 'selected') {
    const selected = new Set(preference.localeIds.map((id) => String(coerceRelationshipId(id))))
    return others.filter((id) => selected.has(String(id)))
  }
  return []
}
