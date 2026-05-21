/**
 * Strips Payload-internal row `id` fields from array/block data before `create`.
 * Copying them from an existing page causes "Value must be unique" on path `id`.
 * deepStripRowIds recurses into nested arrays so sub-rows (e.g. items inside a
 * Testimonials block) are also stripped.
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
    ? source.contentBlocks.map((block) => deepStripRowIds(block))
    : source.contentBlocks ?? []

  return { dbLayout, contentBlocks }
}

function stripRowId(row: unknown): unknown {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row
  const { id: _removed, ...rest } = row as Record<string, unknown>
  return rest
}

// Strips `id` from a row and recurses into any nested array values so that
// sub-rows (e.g. Testimonials > items) have their IDs stripped too.
function deepStripRowIds(row: unknown): unknown {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row
  const { id: _removed, ...rest } = row as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    result[k] = deepStripNestedIds(v)
  }
  return result
}

function deepStripNestedIds(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map((item) => deepStripRowIds(item))
  }
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = deepStripNestedIds(v)
  }
  return result
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
