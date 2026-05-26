import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mergeDbLayoutStructure, pickMergedBlockData } from './mergeDbLayoutStructure'

describe('pickMergedBlockData', () => {
  it('keeps target when source is empty', () => {
    const picked = pickMergedBlockData({}, { heading: 'مرحبا' }) as { heading?: string }
    assert.equal(picked.heading, 'مرحبا')
  })
})

describe('mergeDbLayoutStructure', () => {
  it('preserves target data when instanceId matches', () => {
    const merged = mergeDbLayoutStructure(
      [
        {
          blockDefinition: 1,
          blockVersion: 10,
          instanceId: 'inst-a',
          label: 'Hero',
          data: { heading: 'Hello' },
        },
      ],
      [
        {
          blockDefinition: 1,
          blockVersion: 10,
          instanceId: 'inst-a',
          label: 'Hero',
          data: { heading: 'مرحبا' },
        },
      ],
    )

    assert.equal(merged.length, 1)
    assert.equal(merged[0]?.instanceId, 'inst-a')
    assert.equal((merged[0]?.data as { heading?: string }).heading, 'مرحبا')
  })

  it('matches by index when instanceId is missing', () => {
    const merged = mergeDbLayoutStructure(
      [
        {
          blockDefinition: 1,
          blockVersion: 10,
          data: { heading: 'Hello' },
        },
      ],
      [
        {
          blockDefinition: 1,
          blockVersion: 10,
          data: { heading: 'مرحبا' },
        },
      ],
    )

    assert.equal(merged.length, 1)
    assert.equal((merged[0]?.data as { heading?: string }).heading, 'مرحبا')
  })

  it('adds new blocks from source with source data', () => {
    const merged = mergeDbLayoutStructure(
      [
        {
          blockDefinition: 2,
          blockVersion: 20,
          instanceId: 'inst-new',
          data: { heading: 'New section' },
        },
      ],
      [],
    )

    assert.equal(merged.length, 1)
    assert.equal((merged[0]?.data as { heading?: string }).heading, 'New section')
  })

  it('drops target blocks removed from source', () => {
    const merged = mergeDbLayoutStructure(
      [],
      [
        {
          blockDefinition: 1,
          blockVersion: 10,
          instanceId: 'orphan',
          data: { heading: 'Old only on target' },
        },
      ],
    )

    assert.equal(merged.length, 0)
  })
})
