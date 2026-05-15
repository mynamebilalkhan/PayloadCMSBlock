/**
 * Normalizes relationship IDs for Payload Local API calls.
 * PostgreSQL uses numeric IDs; JSON bodies and form fields often send strings.
 */
export function coerceRelationshipId(value: string | number): string | number {
  if (typeof value === 'number') return value
  if (/^\d+$/.test(value)) return Number(value)
  return value
}

/** Compare two relationship IDs regardless of string/number mismatch. */
export function relationshipIdsEqual(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  if (a == null || b == null) return false
  return String(a) === String(b)
}
