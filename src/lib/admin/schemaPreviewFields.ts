import type { BlockField, BlockSchema, UIWidth } from '@/validation/types'

export const PREVIEW_MAX_TOP_LEVEL_FIELDS = 10
export const PREVIEW_MAX_GROUP_CHILDREN = 4
export const PREVIEW_MAX_ARRAY_ROWS = 2

export function isBlockSchema(value: unknown): value is BlockSchema {
  return (
    value != null &&
    typeof value === 'object' &&
    Array.isArray((value as BlockSchema).fields)
  )
}

export function extractBlockSchema(source: {
  schema?: unknown
  currentVersion?: { schema?: unknown } | null
}): BlockSchema | null {
  if (isBlockSchema(source.schema)) return source.schema
  if (isBlockSchema(source.currentVersion?.schema)) {
    return source.currentVersion.schema
  }
  return null
}

export function isPreviewableField(field: BlockField): boolean {
  return field.admin?.hidden !== true
}

/** Admin order, hidden fields removed. */
export function sortFieldsForPreview(fields: BlockField[]): BlockField[] {
  return [...fields]
    .filter(isPreviewableField)
    .sort((a, b) => {
      const orderA = a.ui?.order ?? 1000
      const orderB = b.ui?.order ?? 1000
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
}

export function fieldWidthPercent(width?: UIWidth): string {
  switch (width) {
    case 'quarter':
      return '24%'
    case 'third':
      return '32%'
    case 'half':
      return '48%'
    case 'full':
    default:
      return '100%'
  }
}

export function pickTopLevelPreviewFields(schema: BlockSchema): BlockField[] {
  return sortFieldsForPreview(schema.fields).slice(0, PREVIEW_MAX_TOP_LEVEL_FIELDS)
}
