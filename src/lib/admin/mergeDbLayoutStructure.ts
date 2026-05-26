import { randomUUID } from 'crypto'

import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'
import { normalizeBlockData } from '@/lib/blockData/normalizeBlockData'
import {
  sameDbLayoutStructure,
  type DbLayoutRowLike,
} from '@/lib/admin/ensureDbLayoutInstanceIds'

export type { DbLayoutRowLike }

function extractRelId(val: unknown): string | number | undefined {
  if (val == null || val === '') return undefined
  if (typeof val === 'number') return val
  if (typeof val === 'string') return coerceRelationshipId(val)
  if (typeof val === 'object' && val !== null && 'id' in val) {
    const id = (val as { id: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return coerceRelationshipId(id)
  }
  return undefined
}

function hasMeaningfulBlockData(data: unknown): boolean {
  return Object.keys(normalizeBlockData(data)).length > 0
}

/** Prefer translated target content; never replace non-empty target with empty source. */
export function pickMergedBlockData(sourceData: unknown, targetData: unknown): unknown {
  const target = normalizeBlockData(targetData)
  if (hasMeaningfulBlockData(target)) {
    return target
  }
  const source = normalizeBlockData(sourceData)
  if (hasMeaningfulBlockData(source)) {
    return source
  }
  return target
}

function resolveInstanceId(sourceRow: DbLayoutRowLike, matchedTarget?: DbLayoutRowLike): string {
  const fromSource = sourceRow.instanceId?.trim()
  if (fromSource) return fromSource
  const fromTarget = matchedTarget?.instanceId?.trim()
  if (fromTarget) return fromTarget
  return randomUUID()
}

function findMatchingTargetRow(
  sourceRow: DbLayoutRowLike,
  sourceIndex: number,
  targetRows: DbLayoutRowLike[],
  usedTargetIndices: Set<number>,
): DbLayoutRowLike | undefined {
  const sourceInstanceId = sourceRow.instanceId?.trim()
  if (sourceInstanceId) {
    const idx = targetRows.findIndex(
      (row, i) => !usedTargetIndices.has(i) && row.instanceId === sourceInstanceId,
    )
    if (idx >= 0) {
      usedTargetIndices.add(idx)
      return targetRows[idx]
    }
  }

  const atIndex = targetRows[sourceIndex]
  if (atIndex && !usedTargetIndices.has(sourceIndex) && sameDbLayoutStructure(sourceRow, atIndex)) {
    usedTargetIndices.add(sourceIndex)
    return atIndex
  }

  for (let i = 0; i < targetRows.length; i++) {
    if (usedTargetIndices.has(i)) continue
    if (sameDbLayoutStructure(sourceRow, targetRows[i]!)) {
      usedTargetIndices.add(i)
      return targetRows[i]
    }
  }

  return undefined
}

function normalizeRow(row: DbLayoutRowLike, data: unknown, instanceId: string): Record<string, unknown> {
  const blockDefinition = extractRelId(row.blockDefinition)
  const blockVersion = extractRelId(row.blockVersion)
  if (blockDefinition == null || blockVersion == null) {
    return {}
  }

  return {
    blockDefinition,
    blockVersion,
    instanceId,
    label: row.label ?? undefined,
    hidden: row.hidden ?? false,
    anchor: row.anchor ?? undefined,
    data: normalizeBlockData(data),
  }
}

/**
 * Applies default-locale block structure to a target locale page.
 * - Order and structural fields follow the source.
 * - Matched blocks keep target `data` (translated content).
 * - New blocks on the source use default-locale `data` as a starting point.
 */
export function mergeDbLayoutStructure(
  sourceRows: DbLayoutRowLike[],
  targetRows: DbLayoutRowLike[],
): Record<string, unknown>[] {
  const usedTargetIndices = new Set<number>()
  const merged: Record<string, unknown>[] = []

  for (let sourceIndex = 0; sourceIndex < sourceRows.length; sourceIndex++) {
    const sourceRow = sourceRows[sourceIndex]!
    const existing = findMatchingTargetRow(sourceRow, sourceIndex, targetRows, usedTargetIndices)
    const instanceId = resolveInstanceId(sourceRow, existing)

    if (existing) {
      merged.push(
        normalizeRow(
          {
            blockDefinition: sourceRow.blockDefinition,
            blockVersion: sourceRow.blockVersion,
            instanceId,
            label: sourceRow.label ?? existing.label,
            hidden: sourceRow.hidden ?? existing.hidden,
            anchor: sourceRow.anchor ?? existing.anchor,
          },
          pickMergedBlockData(sourceRow.data, existing.data),
        ),
      )
      continue
    }

    merged.push(
      normalizeRow(
        {
          blockDefinition: sourceRow.blockDefinition,
          blockVersion: sourceRow.blockVersion,
          instanceId,
          label: sourceRow.label,
          hidden: sourceRow.hidden,
          anchor: sourceRow.anchor,
        },
        sourceRow.data,
      ),
    )
  }

  return merged.filter((row) => Object.keys(row).length > 0)
}
