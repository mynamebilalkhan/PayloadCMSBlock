/** Normalize Payload JSON field values (object or stringified JSON). */
export function normalizeBlockData(value: unknown): Record<string, unknown> {
  if (value == null) return {}

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return {}
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
    return {}
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}
