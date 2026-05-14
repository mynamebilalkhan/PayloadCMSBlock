'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocaleOption {
  id: string | number
  name: string
  code: string
  flag?: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DuplicateForLocale() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: pageId } = useDocumentInfo() as any as { id?: string | number }
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [locales, setLocales] = useState<LocaleOption[]>([])
  const [selectedLocaleId, setSelectedLocaleId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openModal = async () => {
    setError(null)
    setOpen(true)
    try {
      const res = await fetch('/api/locales?limit=100&sort=sortOrder')
      const data = await res.json() as { docs: LocaleOption[] }
      setLocales(data.docs ?? [])
    } catch {
      setError('Could not load locales.')
    }
  }

  const handleDuplicate = async () => {
    if (!selectedLocaleId || !pageId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/duplicate-page-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, targetLocaleId: selectedLocaleId }),
      })
      const data = await res.json() as { success?: boolean; pageId?: string | number; error?: string; existingId?: string | number }

      if (!res.ok) {
        if (res.status === 409 && data.existingId) {
          router.push(`/admin/collections/pages/${data.existingId}`)
          setOpen(false)
          return
        }
        setError(data.error ?? 'Duplicate failed.')
        return
      }

      if (data.success && data.pageId) {
        router.push(`/admin/collections/pages/${data.pageId}`)
        setOpen(false)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!pageId) return null

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#fff',
          fontSize: '13px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Translate to…
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              minWidth: 320,
              maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              Duplicate page for locale
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Creates a draft copy of this page in the selected locale with the same content.
            </p>

            {locales.length === 0 && !error && (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading locales…</p>
            )}

            {locales.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {locales.map((locale) => (
                  <label
                    key={locale.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `2px solid ${selectedLocaleId === String(locale.id) ? '#3b82f6' : '#e5e7eb'}`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      background: selectedLocaleId === String(locale.id) ? '#eff6ff' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="targetLocale"
                      value={String(locale.id)}
                      checked={selectedLocaleId === String(locale.id)}
                      onChange={(e) => setSelectedLocaleId(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    {locale.flag && <span style={{ fontSize: '18px' }}>{locale.flag}</span>}
                    <span style={{ fontWeight: 500 }}>{locale.name}</span>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>({locale.code})</span>
                  </label>
                ))}
              </div>
            )}

            {error && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={!selectedLocaleId || loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: selectedLocaleId && !loading ? '#3b82f6' : '#93c5fd',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: selectedLocaleId && !loading ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                {loading ? 'Creating…' : 'Create translation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
