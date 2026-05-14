import React from 'react'
import './globals.css'
import '@/blocks/registry-setup'

/**
 * Frontend route group root layout.
 *
 * This is intentionally minimal: it only loads the global CSS and registers
 * the block registry. The html/body element, locale-specific header/footer,
 * theme injection, and RTL direction are handled by the [locale]/layout.tsx
 * nested layout, which has access to the locale URL param.
 */
export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
