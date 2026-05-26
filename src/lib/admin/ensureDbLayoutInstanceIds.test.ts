import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ensureDbLayoutInstanceIds } from './ensureDbLayoutInstanceIds'

describe('ensureDbLayoutInstanceIds', () => {
  it('restores instanceId from previous row by payload array id', () => {
    const result = ensureDbLayoutInstanceIds(
      [{ id: 'row-1', blockDefinition: 1, blockVersion: 10, data: {} }],
      [{ id: 'row-1', blockDefinition: 1, blockVersion: 10, instanceId: 'stable-id', data: {} }],
    )

    assert.equal(result[0]?.instanceId, 'stable-id')
  })

  it('assigns new instanceId for genuinely new rows', () => {
    const result = ensureDbLayoutInstanceIds(
      [{ blockDefinition: 2, blockVersion: 20, data: {} }],
      [],
    )

    assert.ok(result[0]?.instanceId && result[0].instanceId.length > 0)
  })
})
