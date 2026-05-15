import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  filterPageGroups,
  groupPagesByTranslation,
  type LocaleDoc,
  type PageDoc,
} from './groupPagesByTranslation.js'

const locales: LocaleDoc[] = [
  { id: 1, name: 'English', code: 'en', isDefault: true, flag: '🇬🇧' },
  { id: 2, name: 'Urdu', code: 'ur', isDefault: false, flag: '🇵🇰' },
]

describe('groupPagesByTranslation', () => {
  it('merges locale variants into one group', () => {
    const pages: PageDoc[] = [
      {
        id: 'en-home',
        title: 'Home',
        slug: '/',
        status: 'draft',
        updatedAt: '2026-05-15T07:41:00.000Z',
        translationGroupId: 'group-1',
        locale: locales[0]!,
      },
      {
        id: 'ur-home',
        title: 'Home',
        slug: '/',
        status: 'draft',
        updatedAt: '2026-05-15T07:43:00.000Z',
        translationGroupId: 'group-1',
        locale: locales[1]!,
      },
    ]

    const groups = groupPagesByTranslation(pages, locales)

    assert.equal(groups.length, 1)
    assert.equal(groups[0]!.title, 'Home')
    assert.equal(groups[0]!.slug, '/')
    assert.equal(groups[0]!.primaryPageId, 'en-home')
    assert.equal(groups[0]!.translations.length, 2)
    assert.equal(groups[0]!.isComplete, true)
  })

  it('marks incomplete groups when a locale is missing', () => {
    const pages: PageDoc[] = [
      {
        id: 'en-about',
        title: 'About',
        slug: 'about',
        status: 'published',
        updatedAt: '2026-05-14T10:00:00.000Z',
        translationGroupId: 'group-2',
        locale: locales[0]!,
      },
    ]

    const groups = groupPagesByTranslation(pages, locales)

    assert.equal(groups.length, 1)
    assert.equal(groups[0]!.isComplete, false)
    assert.equal(groups[0]!.translations[1]!.page, undefined)
  })
})

describe('filterPageGroups', () => {
  const groups = groupPagesByTranslation(
    [
      {
        id: 'en-home',
        title: 'Home',
        slug: '/',
        status: 'draft',
        updatedAt: '2026-05-15T07:41:00.000Z',
        translationGroupId: 'group-1',
        locale: locales[0]!,
      },
      {
        id: 'ur-home',
        title: 'Home',
        slug: '/',
        status: 'draft',
        updatedAt: '2026-05-15T07:43:00.000Z',
        translationGroupId: 'group-1',
        locale: locales[1]!,
      },
      {
        id: 'en-about',
        title: 'About',
        slug: 'about',
        status: 'published',
        updatedAt: '2026-05-14T10:00:00.000Z',
        translationGroupId: 'group-2',
        locale: locales[0]!,
      },
    ],
    locales,
  )

  it('filters by search across title and slug', () => {
    const result = filterPageGroups(groups, { search: 'about' })
    assert.equal(result.length, 1)
    assert.equal(result[0]!.slug, 'about')
  })

  it('filters incomplete translations only', () => {
    const result = filterPageGroups(groups, { incompleteOnly: true })
    assert.equal(result.length, 1)
    assert.equal(result[0]!.slug, 'about')
  })
})
