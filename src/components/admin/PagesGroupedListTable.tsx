'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  filterPageGroups,
  type LocaleDoc,
  type PageGroup,
  type PageGroupStatusSummary,
} from '@/lib/admin/groupPagesByTranslation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PagesGroupedListTableProps {
  groups: PageGroup[]
  locales: LocaleDoc[]
  hasCreatePermission: boolean
  newDocumentURL: string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const statusColors: Record<PageGroupStatusSummary, string> = {
  draft: 'var(--theme-warning-500)',
  published: 'var(--theme-success-500)',
  archived: 'var(--theme-elevation-400)',
  mixed: 'var(--theme-elevation-500)',
}

const perPageOptions = [10, 25, 50]

// ─── Main table ───────────────────────────────────────────────────────────────

export function PagesGroupedListTable({
  groups,
  locales,
  hasCreatePermission,
  newDocumentURL,
}: PagesGroupedListTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const [duplicateState, setDuplicateState] = useState<{
    sourcePageId: string | number
    targetLocale: LocaleDoc
  } | null>(null)
  const [duplicating, setDuplicating] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  const filtered = useMemo(
    () => filterPageGroups(groups, { search, incompleteOnly }),
    [groups, search, incompleteOnly],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const pageSlice = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const handleDuplicate = useCallback(async () => {
    if (!duplicateState) return

    setDuplicating(true)
    setDuplicateError(null)

    const targetLocaleId = duplicateState.targetLocale.id
    const serializedTarget =
      Number.isFinite(Number(targetLocaleId)) &&
      String(Number(targetLocaleId)) === String(targetLocaleId)
        ? Number(targetLocaleId)
        : targetLocaleId

    try {
      const res = await fetch('/api/admin/duplicate-page-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          pageId: duplicateState.sourcePageId,
          targetLocaleId: serializedTarget,
        }),
      })
      const data = (await res.json()) as {
        success?: boolean
        pageId?: string | number
        error?: string
        existingId?: string | number
      }

      if (!res.ok) {
        if (res.status === 409 && data.existingId) {
          router.push(`/admin/collections/pages/${data.existingId}`)
          setDuplicateState(null)
          return
        }
        setDuplicateError(data.error ?? 'Could not create translation.')
        return
      }

      if (data.success && data.pageId) {
        router.push(`/admin/collections/pages/${data.pageId}`)
        setDuplicateState(null)
      }
    } catch {
      setDuplicateError('Network error. Please try again.')
    } finally {
      setDuplicating(false)
    }
  }, [duplicateState, router])

  const openCreateTranslation = (group: PageGroup, targetLocale: LocaleDoc) => {
    setDuplicateError(null)
    setDuplicateState({ sourcePageId: group.primaryPageId, targetLocale })
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <input
          type="search"
          placeholder="Search by page title or slug…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={{
            flex: '1 1 220px',
            minWidth: 200,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--theme-border-color)',
            background: 'var(--theme-elevation-50)',
            color: 'var(--theme-text)',
            fontSize: '13px',
          }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '13px',
            color: 'var(--theme-text)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={incompleteOnly}
            onChange={(e) => {
              setIncompleteOnly(e.target.checked)
              setPage(1)
            }}
          />
          Incomplete translations only
        </label>
      </div>

      <div
        style={{
          border: '1px solid var(--theme-border-color)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--theme-elevation-0, var(--theme-bg))',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--theme-elevation-100)' }}>
              {['Page Title', 'Slug', 'Locales', 'Status', 'Updated At'].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    fontWeight: 600,
                    color: 'var(--theme-elevation-600)',
                    borderBottom: '1px solid var(--theme-border-color)',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageSlice.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--theme-elevation-400)',
                  }}
                >
                  {groups.length === 0
                    ? 'No pages yet.'
                    : 'No pages match your search or filters.'}
                </td>
              </tr>
            )}
            {pageSlice.map((group) => (
              <tr
                key={group.translationGroupId}
                style={{ borderBottom: '1px solid var(--theme-border-color)' }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <Link
                    href={`/admin/collections/pages/${group.primaryPageId}`}
                    style={{
                      color: 'var(--theme-text)',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    {group.title}
                  </Link>
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    color: 'var(--theme-elevation-500)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  {group.slug}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.translations.map(({ locale, page: localePage }) => (
                      <LocaleChip
                        key={String(locale.id)}
                        locale={locale}
                        pageId={localePage?.id}
                        status={localePage?.status}
                        onCreate={() => openCreateTranslation(group, locale)}
                      />
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <StatusBadge status={group.statusSummary} />
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    color: 'var(--theme-elevation-500)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(group.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '13px',
          color: 'var(--theme-elevation-500)',
        }}
      >
        <span>
          {filtered.length === 0
            ? '0 pages'
            : `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, filtered.length)} of ${filtered.length}`}
          {filtered.length !== groups.length && ` (${groups.length} total groups)`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Per page:
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid var(--theme-border-color)',
                background: 'var(--theme-elevation-50)',
                color: 'var(--theme-text)',
              }}
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {duplicateState && (
        <DuplicateModal
          locale={duplicateState.targetLocale}
          error={duplicateError}
          loading={duplicating}
          onConfirm={handleDuplicate}
          onClose={() => {
            setDuplicateState(null)
            setDuplicateError(null)
          }}
        />
      )}

      {hasCreatePermission && (
        <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--theme-elevation-400)' }}>
          <Link href={newDocumentURL} style={{ color: 'var(--theme-success-500)' }}>
            Create new page
          </Link>
          {' · '}
          {locales.length} enabled locale{locales.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function LocaleChip({
  locale,
  pageId,
  status,
  onCreate,
}: {
  locale: LocaleDoc
  pageId?: string | number
  status?: 'draft' | 'published' | 'archived'
  onCreate: () => void
}) {
  if (pageId) {
    return (
      <Link
        href={`/admin/collections/pages/${pageId}`}
        title={`Open ${locale.name} (${status ?? 'draft'})`}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 999,
          fontSize: '11px',
          fontWeight: 500,
          textDecoration: 'none',
          border: '1px solid var(--theme-border-color)',
          background: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
        }}
      >
        {locale.flag && <span>{locale.flag}</span>}
        <span>{locale.code.toUpperCase()}</span>
        <span style={{ color: statusColors[status ?? 'draft'], fontSize: '10px' }}>
          {status ?? 'draft'}
        </span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      title={`Create ${locale.name} translation`}
      onClick={(e) => {
        e.stopPropagation()
        onCreate()
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        border: '1px dashed var(--theme-elevation-400)',
        background: 'transparent',
        color: 'var(--theme-elevation-500)',
      }}
    >
      {locale.flag && <span>{locale.flag}</span>}
      <span>{locale.code.toUpperCase()}</span>
      <span>+</span>
    </button>
  )
}

function StatusBadge({ status }: { status: PageGroupStatusSummary }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      style={{
        fontSize: '12px',
        fontWeight: 500,
        color: statusColors[status],
      }}
    >
      {label}
    </span>
  )
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <PagerButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </PagerButton>
      <span style={{ padding: '4px 8px' }}>
        {page} / {totalPages}
      </span>
      <PagerButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </PagerButton>
    </div>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        border: '1px solid var(--theme-border-color)',
        background: disabled ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-50)',
        color: disabled ? 'var(--theme-elevation-400)' : 'var(--theme-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px',
      }}
    >
      {children}
    </button>
  )
}

function DuplicateModal({
  locale,
  error,
  loading,
  onConfirm,
  onClose,
}: {
  locale: LocaleDoc
  error: string | null
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--theme-elevation-0, var(--theme-bg))',
          border: '1px solid var(--theme-border-color)',
          borderRadius: 12,
          padding: 24,
          minWidth: 320,
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          color: 'var(--theme-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
          Create translation
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
          Create a draft copy for{' '}
          <strong>
            {locale.flag} {locale.name} ({locale.code})
          </strong>{' '}
          with the same page builder layout.
        </p>
        {error && (
          <p style={{ color: 'var(--theme-error-500)', fontSize: '13px', marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--theme-border-color)',
              background: 'var(--theme-elevation-100)',
              color: 'var(--theme-text)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: loading ? 'var(--theme-elevation-300)' : 'var(--theme-success-500)',
              color: loading ? 'var(--theme-elevation-500)' : '#fff',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            {loading ? 'Creating…' : 'Create translation'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
