import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  coerceRelationshipId,
  normalizeBlockData,
  stripUnknownKeys,
} from './blockDataUtils.js'

describe('normalizeBlockData', () => {
  it('parses JSON strings', () => {
    const result = normalizeBlockData('{"title":"Hello","founded":"1996"}')
    assert.equal(result.title, 'Hello')
    assert.equal(result.founded, '1996')
  })

  it('returns empty object for nullish values', () => {
    assert.deepEqual(normalizeBlockData(null), {})
    assert.deepEqual(normalizeBlockData(undefined), {})
  })
})

describe('stripUnknownKeys', () => {
  const schema = {
    fields: [
      { name: 'title', type: 'text' as const },
      { name: 'founded', type: 'text' as const },
    ],
  }

  it('keeps allowed keys and reports removed keys', () => {
    const { cleaned, removedKeys } = stripUnknownKeys(
      { title: 'Hi', founded: '1996', orphan: true },
      schema,
    )
    assert.deepEqual(cleaned, { title: 'Hi', founded: '1996' })
    assert.deepEqual(removedKeys, ['orphan'])
  })
})

describe('coerceRelationshipId', () => {
  it('coerces populated relationship objects and numbers', () => {
    assert.equal(coerceRelationshipId({ id: 12 }), '12')
    assert.equal(coerceRelationshipId(12), '12')
    assert.equal(coerceRelationshipId('12'), '12')
    assert.equal(coerceRelationshipId(null), null)
  })
})
