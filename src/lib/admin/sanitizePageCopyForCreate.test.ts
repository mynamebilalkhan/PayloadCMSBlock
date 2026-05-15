import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { sanitizePageCopyForCreate, sampleArrayRowIds } from './sanitizePageCopyForCreate.js'

describe('sanitizePageCopyForCreate', () => {
  it('removes internal id from dbLayout and contentBlocks rows', () => {
    const source = {
      dbLayout: [{ id: 'row-abc', blockDefinition: 1, data: {} }],
      contentBlocks: [{ id: 'block-xyz', blockType: 'testimonials' }],
    }

    const before = sampleArrayRowIds(source)
    assert.equal(before.dbLayoutFirstId, 'row-abc')
    assert.equal(before.contentBlocksFirstId, 'block-xyz')

    const { dbLayout, contentBlocks } = sanitizePageCopyForCreate(source)
    const after = sampleArrayRowIds({ dbLayout, contentBlocks })

    assert.equal(after.dbLayoutFirstId, undefined)
    assert.equal(after.contentBlocksFirstId, undefined)
    assert.equal((dbLayout as Record<string, unknown>[])[0]?.blockDefinition, 1)
  })
})
