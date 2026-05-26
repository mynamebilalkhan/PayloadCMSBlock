import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldSeedPages } from './localeSeedPages'

test('shouldSeedPages on create when copy enabled', () => {
  assert.equal(
    shouldSeedPages({
      operation: 'create',
      doc: { duplicatePagesFromDefault: true, isDefault: false, isEnabled: true },
    }),
    true,
  )
})

test('shouldSeedPages skips default locale', () => {
  assert.equal(
    shouldSeedPages({
      operation: 'create',
      doc: { duplicatePagesFromDefault: true, isDefault: true, isEnabled: true },
    }),
    false,
  )
})

test('shouldSeedPages on enable', () => {
  assert.equal(
    shouldSeedPages({
      operation: 'update',
      doc: { duplicatePagesFromDefault: true, isEnabled: true },
      previousDoc: { isEnabled: false },
    }),
    true,
  )
})
