import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveBlockPreviewVariant } from './blockDefinitionPreview'

describe('resolveBlockPreviewVariant', () => {
  it('uses slug hints before category', () => {
    assert.equal(
      resolveBlockPreviewVariant({ slug: 'hero-banner', category: 'utility' }),
      'hero',
    )
    assert.equal(resolveBlockPreviewVariant({ slug: 'home-faq', category: 'content' }), 'faq')
  })

  it('falls back to category', () => {
    assert.equal(resolveBlockPreviewVariant({ slug: 'custom-block', category: 'media' }), 'media')
  })
})
