'use client'

import { createContext, useContext } from 'react'
import type { LocaleRecord } from './index'

// ─── Context ──────────────────────────────────────────────────────────────────

const LocaleContext = createContext<LocaleRecord | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LocaleProvider({
  locale,
  children,
}: {
  locale: LocaleRecord
  children: React.ReactNode
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Returns the current locale. Must be used inside a LocaleProvider. */
export function useLocale(): LocaleRecord {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
