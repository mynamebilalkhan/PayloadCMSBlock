import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { pickTopLevelPreviewFields, sortFieldsForPreview } from './schemaPreviewFields'
import type { BlockField } from '@/validation/types'

describe('schemaPreviewFields', () => {
  it('omits hidden fields and respects ui.order', () => {
    const fields: BlockField[] = [
      { name: 'z', type: 'text', admin: { hidden: true } },
      { name: 'b', type: 'text', ui: { order: 2 } },
      { name: 'a', type: 'text', ui: { order: 1 } },
    ]

    const sorted = sortFieldsForPreview(fields)
    assert.deepEqual(sorted.map((f) => f.name), ['a', 'b'])
  })

  it('limits top-level preview fields', () => {
    const fields: BlockField[] = Array.from({ length: 15 }, (_, i) => ({
      name: `f${i}`,
      type: 'text' as const,
    }))

    assert.equal(pickTopLevelPreviewFields({ fields }).length, 10)
  })
})
