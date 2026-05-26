import assert from 'node:assert/strict'
import test from 'node:test'

import { CUSTOM_FONT_SIZE, isValidCssFontSize, resolveFontSize, withCustomSizeOption } from './fontSize'

test('withCustomSizeOption appends Custom entry', () => {
  const opts = withCustomSizeOption([{ label: '1 rem', value: '1rem' }])
  assert.equal(opts.length, 2)
  assert.equal(opts[1]?.value, CUSTOM_FONT_SIZE)
})

test('resolveFontSize uses preset when not custom', () => {
  assert.equal(resolveFontSize('2rem', undefined, '1rem'), '2rem')
})

test('resolveFontSize uses custom field when preset is custom', () => {
  assert.equal(resolveFontSize(CUSTOM_FONT_SIZE, ' 2.75rem ', '1rem'), '2.75rem')
  assert.equal(resolveFontSize(CUSTOM_FONT_SIZE, '', '1rem'), '1rem')
})

test('isValidCssFontSize accepts common units', () => {
  assert.equal(isValidCssFontSize('44px'), true)
  assert.equal(isValidCssFontSize('2.75rem'), true)
  assert.equal(isValidCssFontSize('inherit'), true)
  assert.equal(isValidCssFontSize('clamp(1rem, 2vw, 1.5rem)'), true)
  assert.equal(isValidCssFontSize('not-a-size'), false)
})
