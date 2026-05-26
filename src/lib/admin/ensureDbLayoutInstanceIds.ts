import { randomUUID } from 'crypto'

import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'

export type DbLayoutRowLike = {
  id?: string | null
  blockDefinition?: unknown
  blockVersion?: unknown
  instanceId?: string | null
  label?: string | null
  hidden?: boolean | null
  anchor?: string | null
  data?: unknown
}

function extractRelId(val: unknown): string | undefined {
  if (val == null || val === '') return undefined
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') return String(coerceRelationshipId(val))
  if (typeof val === 'object' && val !== null && 'id' in val) {
    const id = (val as { id: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') {
      return String(coerceRelationshipId(id))
    }
  }
  return undefined
}

export function sameDbLayoutStructure(a: DbLayoutRowLike, b: DbLayoutRowLike): boolean {
  const defA = extractRelId(a.blockDefinition)
  const defB = extractRelId(b.blockDefinition)
  const verA = extractRelId(a.blockVersion)
  const verB = extractRelId(b.blockVersion)
  return defA != null && defA === defB && verA != null && verA === verB
}

/**
 * Ensures every dbLayout row has a stable instanceId before save.
 * Restores IDs from the previous document when the admin form omits hidden fields.
 */
export function ensureDbLayoutInstanceIds(
  incoming: unknown,
  previous: unknown,
): DbLayoutRowLike[] {
  if (!Array.isArray(incoming)) return []

  const prevRows = Array.isArray(previous) ? (previous as DbLayoutRowLike[]) : []

  const prevByPayloadRowId = new Map<string, DbLayoutRowLike>()
  const prevByInstanceId = new Map<string, DbLayoutRowLike>()
  for (const row of prevRows) {
    if (row?.id) prevByPayloadRowId.set(String(row.id), row)
    if (row?.instanceId) prevByInstanceId.set(String(row.instanceId), row)
  }

  return incoming.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return raw as DbLayoutRowLike
    }

    const row = { ...(raw as DbLayoutRowLike) }
    const existingId = row.instanceId?.trim()

    if (existingId) {
      return row
    }

    if (row.id) {
      const fromRowId = prevByPayloadRowId.get(String(row.id))
      if (fromRowId?.instanceId) {
        row.instanceId = fromRowId.instanceId
        return row
      }
    }

    const prevAtIndex = prevRows[index]
    if (prevAtIndex?.instanceId && sameDbLayoutStructure(row, prevAtIndex)) {
      row.instanceId = prevAtIndex.instanceId
      return row
    }

    for (const prevRow of prevRows) {
      if (prevRow.instanceId && sameDbLayoutStructure(row, prevRow)) {
        row.instanceId = prevRow.instanceId
        return row
      }
    }

    row.instanceId = randomUUID()
    return row
  })
}
