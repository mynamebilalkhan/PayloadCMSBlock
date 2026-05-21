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

  it('removes ids from nested array rows inside contentBlocks', () => {
    const source = {
      dbLayout: [],
      contentBlocks: [
        {
          id: 'block-xyz',
          blockType: 'testimonials',
          items: [
            { id: 'item-1', name: 'John Doe', company: 'Acme', testimonial: 'Great!' },
            { id: 'item-2', name: 'Jane Doe', company: 'Beta', testimonial: 'Excellent!' },
          ],
        },
      ],
    }

    const { contentBlocks } = sanitizePageCopyForCreate(source)
    const blocks = contentBlocks as Array<Record<string, unknown>>

    assert.equal(blocks[0]?.id, undefined, 'top-level block id stripped')
    const items = blocks[0]?.items as Array<Record<string, unknown>>
    assert.equal(items[0]?.id, undefined, 'nested item id stripped')
    assert.equal(items[0]?.name, 'John Doe', 'item data preserved')
    assert.equal(items[1]?.id, undefined, 'second nested item id stripped')
  })
})
