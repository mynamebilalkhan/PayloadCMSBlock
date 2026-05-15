/**
 * Strips Payload-internal row `id` fields from array/block data before `create`.
 * Copying them from an existing page causes "Value must be unique" on path `id`.
 */
export function sanitizePageCopyForCreate(source: {
  dbLayout?: unknown
  contentBlocks?: unknown
}): {
  dbLayout: unknown
  contentBlocks: unknown
} {
  const dbLayout = Array.isArray(source.dbLayout)
    ? source.dbLayout.map((row) => stripRowId(row))
    : source.dbLayout ?? []

  const contentBlocks = Array.isArray(source.contentBlocks)
    ? source.contentBlocks.map((block) => stripRowId(block))
    : source.contentBlocks ?? []

  return { dbLayout, contentBlocks }
}

function stripRowId(row: unknown): unknown {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row
  const { id: _removed, ...rest } = row as Record<string, unknown>
  return rest
}

export function sampleArrayRowIds(source: {
  dbLayout?: unknown
  contentBlocks?: unknown
}): {
  dbLayoutFirstId: unknown
  contentBlocksFirstId: unknown
  dbLayoutLength: number
  contentBlocksLength: number
} {
  const db0 = Array.isArray(source.dbLayout) ? source.dbLayout[0] : undefined
  const cb0 = Array.isArray(source.contentBlocks) ? source.contentBlocks[0] : undefined
  return {
    dbLayoutFirstId:
      db0 && typeof db0 === 'object' && 'id' in db0
        ? (db0 as { id: unknown }).id
        : undefined,
    contentBlocksFirstId:
      cb0 && typeof cb0 === 'object' && 'id' in cb0
        ? (cb0 as { id: unknown }).id
        : undefined,
    dbLayoutLength: Array.isArray(source.dbLayout) ? source.dbLayout.length : 0,
    contentBlocksLength: Array.isArray(source.contentBlocks) ? source.contentBlocks.length : 0,
  }
}
