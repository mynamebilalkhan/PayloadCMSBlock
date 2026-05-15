'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  fetchEnabledLocales,
  fetchTranslationSiblings,
  siblingsByLocaleId,
  type LocaleOption,
  type SiblingPage,
} from '@/lib/admin/pageTranslationNav'

export function usePageTranslationSiblings(
  translationGroupId: string | undefined,
  refreshKey?: string | number,
) {
  const [locales, setLocales] = useState<LocaleOption[]>([])
  const [siblings, setSiblings] = useState<SiblingPage[]>([])
  const [siblingByLocale, setSiblingByLocale] = useState<Map<string, SiblingPage>>(new Map())
  const [loading, setLoading] = useState(false)

  const reload = useCallback(() => {
    if (!translationGroupId) {
      setSiblings([])
      setSiblingByLocale(new Map())
      return
    }

    setLoading(true)
    Promise.all([fetchTranslationSiblings(translationGroupId), fetchEnabledLocales()])
      .then(([pages, localeDocs]) => {
        setSiblings(pages)
        setSiblingByLocale(siblingsByLocaleId(pages))
        setLocales(localeDocs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [translationGroupId])

  useEffect(() => {
    reload()
  }, [reload, refreshKey])

  return { locales, siblings, siblingByLocale, loading, reload }
}
