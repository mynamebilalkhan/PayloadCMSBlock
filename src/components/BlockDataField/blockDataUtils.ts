import type { BlockSchema } from '@/validation/types'
import { normalizeBlockData } from '@/lib/blockData/normalizeBlockData'

export { normalizeBlockData }

/** Remove top-level keys not defined in the block schema. */
export function stripUnknownKeys(
  data: Record<string, unknown>,
  schema: BlockSchema,
): { cleaned: Record<string, unknown>; removedKeys: string[] } {
  const allowed = new Set(schema.fields.map((f) => f.name))
  const cleaned: Record<string, unknown> = {}
  const removedKeys: string[] = []

  for (const key of Object.keys(data)) {
    if (allowed.has(key)) {
      cleaned[key] = data[key]
    } else {
      removedKeys.push(key)
    }
  }

  return { cleaned, removedKeys }
}

export function coerceRelationshipId(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return String(value)
}
