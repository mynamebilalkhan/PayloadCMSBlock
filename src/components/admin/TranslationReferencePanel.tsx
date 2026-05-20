'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useFormFields, useField } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'

import { AdminButton } from '@/components/admin/AdminUI'
import { useDocumentInfo } from '@payloadcms/ui'
import { normalizeBlockData } from '@/lib/blockData/normalizeBlockData'
import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferencePage {
  id: string | number
  title: string
  slug: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
  dbLayout?: unknown[]
  contentBlocks?: unknown[]
  locale?: { code?: string; name?: string } | string | number
}

interface DefaultLocale {
  id: string | number
  code: string
  name: string
  flag?: string | null
}

interface SiblingResponse {
  page: ReferencePage
  defaultLocale: DefaultLocale
}

interface TranslatableField {
  path: string
  label: string
  sourceValue: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TranslationReferencePanel(props: UIFieldClientProps) {
  return <TranslationReferencePanelContent {...props} />
}

function TranslationReferencePanelContent(_props: UIFieldClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: pageId } = useDocumentInfo() as any as { id?: string | number }
  const translationGroupId = useFormFields(([fields]) =>
    fields.translationGroupId?.value as string | undefined
  )
  const currentLocale = useFormFields(([fields]) =>
    fields.locale?.value as { code?: string } | string | number | undefined
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formDispatch = useFormFields(([, dispatch]) => dispatch as (action: { type: string; path: string; value: unknown }) => void)

  // Read block data from individual sub-field paths so we always see the live form values.
  // dbLayoutField.value (the top-level array) is a separate slot in Payload's form state and
  // does NOT reflect edits made by BlockDataField through its own useField(dbLayout.N.data).
  const currentBlockData = useFormFields(([fields]) => {
    const result: Array<{ data: Record<string, unknown> }> = []
    for (const [key, fieldState] of Object.entries(fields)) {
      const match = key.match(/^dbLayout\.(\d+)\.data$/)
      if (match) {
        const i = parseInt(match[1], 10)
        while (result.length <= i) result.push({ data: {} })
        result[i] = { data: normalizeBlockData((fieldState as { value?: unknown })?.value) }
      }
    }
    return result
  })

  const [reference, setReference] = useState<SiblingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyingBlocks, setCopyingBlocks] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)
  const [aiTranslating, setAiTranslating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)

  // Form field bindings for direct editing
  const titleField = useField<string>({ path: 'title' })
  const slugField = useField<string>({ path: 'slug' })
  const metaTitleField = useField<string>({ path: 'seo.metaTitle' })
  const metaDescField = useField<string>({ path: 'seo.metaDescription' })
  const dbLayoutField = useField<Array<{ data?: Record<string, unknown> }>>({ path: 'dbLayout' })

  // Stable refs so async callbacks always call the latest setValue
  const titleSetValueRef = useRef(titleField.setValue)
  const metaTitleSetValueRef = useRef(metaTitleField.setValue)
  const metaDescSetValueRef = useRef(metaDescField.setValue)
  const dbLayoutSetValueRef = useRef(dbLayoutField.setValue)

  useEffect(() => { titleSetValueRef.current = titleField.setValue })
  useEffect(() => { metaTitleSetValueRef.current = metaTitleField.setValue })
  useEffect(() => { metaDescSetValueRef.current = metaDescField.setValue })
  useEffect(() => { dbLayoutSetValueRef.current = dbLayoutField.setValue })

  const fetchReference = useCallback(async () => {
    if (!translationGroupId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/admin/page-sibling?translationGroupId=${encodeURIComponent(translationGroupId)}`,
        { credentials: 'same-origin' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load reference')
      }

      const data = await res.json() as SiblingResponse
      setReference(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reference')
    } finally {
      setLoading(false)
    }
  }, [translationGroupId])

  useEffect(() => {
    fetchReference()
  }, [fetchReference])

  const doAiTranslate = useCallback(async () => {
    if (!reference) return

    setAiTranslating(true)
    setAiError(null)
    setAiSuccess(null)

    try {
      const { page, defaultLocale } = reference

      // Resolve target locale — may be an object { code }, a string code, or a numeric ID.
      // The API route handles all three cases by resolving IDs server-side.
      const targetLocaleCode =
        typeof currentLocale === 'object' && currentLocale !== null
          ? currentLocale.code
          : currentLocale !== undefined && currentLocale !== null
            ? String(currentLocale)
            : undefined

      if (!targetLocaleCode) {
        throw new Error('Cannot determine target locale. Save the page first.')
      }

      // ── 1. Collect simple page-level translatable fields ──────────────────
      const content: Record<string, string> = {}

      if (page.title) content['title'] = page.title
      if (page.seo?.metaTitle) content['seo.metaTitle'] = page.seo.metaTitle
      if (page.seo?.metaDescription) content['seo.metaDescription'] = page.seo.metaDescription

      // ── 2. Collect block strings ──────────────────────────────────────────
      const blockStringKeys: Array<{ blockIndex: number; path: string; contentKey: string }> = []

      if (page.dbLayout && page.dbLayout.length > 0) {
        page.dbLayout.forEach((block, blockIndex) => {
          if (typeof block === 'object' && block !== null) {
            const blockData = (block as { data?: Record<string, unknown> }).data
            if (blockData) {
              const strings = extractAllStrings(blockData)
              strings.forEach(({ path, value }) => {
                if (value.trim().length > 1) {
                  const contentKey = `__block_${blockIndex}__${path}`
                  content[contentKey] = value
                  blockStringKeys.push({ blockIndex, path, contentKey })
                }
              })
            }
          }
        })
      }

      if (Object.keys(content).length === 0) {
        throw new Error('No translatable content found in the source page.')
      }

      // ── 3. Call AI translate API ──────────────────────────────────────────
      console.log('[AI Translate] Sending:', { sourceLocale: defaultLocale.code, targetLocale: targetLocaleCode, stringCount: Object.keys(content).length, contentSample: Object.entries(content).slice(0, 3) })
      const res = await fetch('/api/admin/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sourceLocale: defaultLocale.code,
          targetLocale: targetLocaleCode,
          content,
        }),
      })

      const data = (await res.json()) as {
        translated?: Record<string, string>
        error?: string
        debug?: { sourceLocale: { code: string; name: string }; targetLocale: { code: string; name: string }; stringCount: number }
      }

      console.log('[AI Translate] Response debug:', data.debug)

      if (!res.ok || !data.translated) {
        throw new Error(data.error || 'AI translation failed')
      }

      const { translated } = data
      console.log('[AI Translate] Translated sample:', Object.entries(translated).slice(0, 5))

      // ── 4 & 5. Apply translations onto layout rows (preserve current form rows when possible).
      let newLayout: DbLayoutRow[] | null = null

      if (blockStringKeys.length > 0 && page.dbLayout) {
        const sourceBlocks = page.dbLayout as RawBlock[]
        const currentBlocks = dbLayoutField.value ?? []

        if (currentBlocks.length > 0) {
          newLayout = currentBlocks.map((row, i) =>
            normalizeDbLayoutRow(row as DbLayoutRow, sourceBlocks[i]),
          )
          while (newLayout.length < sourceBlocks.length) {
            newLayout.push(mapSourceBlockToRow(sourceBlocks[newLayout.length]))
          }
        } else {
          newLayout = sourceBlocks.map(mapSourceBlockToRow)
        }

        const keysByBlock = new Map<number, typeof blockStringKeys>()
        for (const entry of blockStringKeys) {
          const list = keysByBlock.get(entry.blockIndex) ?? []
          list.push(entry)
          keysByBlock.set(entry.blockIndex, list)
        }

        keysByBlock.forEach((keys, blockIndex) => {
          if (!newLayout || blockIndex >= newLayout.length) return

          const sourceData = normalizeBlockData(sourceBlocks[blockIndex]?.data)
          const data = JSON.parse(JSON.stringify(sourceData)) as Record<string, unknown>

          for (const { path, contentKey } of keys) {
            const translatedValue = translated[contentKey]
            if (translatedValue) setValueByPath(data, path, translatedValue)
          }

          newLayout[blockIndex] = { ...newLayout[blockIndex], data }
        })
      }

      // Apply translations before setAiTranslating(false) so Save cannot race ahead.
      if (translated['title']) titleSetValueRef.current(translated['title'])
      if (translated['seo.metaTitle']) metaTitleSetValueRef.current(translated['seo.metaTitle'])
      if (translated['seo.metaDescription']) metaDescSetValueRef.current(translated['seo.metaDescription'])
      if (newLayout) {
        // Dispatch targeted UPDATE actions per block data field instead of replacing
        // the whole dbLayout array. Replacing the whole array triggers Payload's row
        // reconciliation which re-registers every sub-field from the original document
        // data, causing the translated values to immediately revert to English.
        newLayout.forEach((row, i) => {
          if (row.data) {
            formDispatch({ type: 'UPDATE', path: `dbLayout.${i}.data`, value: row.data })
          }
        })
      }

      const fieldCount = Object.keys(translated).filter((k) => translated[k]).length
      const src = data.debug?.sourceLocale?.name ?? defaultLocale.name
      const tgt = data.debug?.targetLocale?.name ?? targetLocaleCode
      setAiSuccess(
        `AI translated ${fieldCount} field${fieldCount !== 1 ? 's' : ''} from ${src} → ${tgt}. Review and save to publish.`,
      )
      setTimeout(() => setAiSuccess(null), 8000)

    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI translation failed')
    } finally {
      setAiTranslating(false)
    }
  }, [reference, currentLocale, dbLayoutField.value])

  const doCopyBlocks = useCallback(async () => {
    if (!pageId) return

    setCopyingBlocks(true)
    setCopySuccess(null)
    setShowCopyConfirm(false)

    try {
      const res = await fetch('/api/admin/copy-blocks-from-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ pageId, dryRun: true }),
      })

      const data = await res.json() as {
        success?: boolean
        blocks?: { dbLayout: unknown[]; contentBlocks: unknown[] }
        copied?: { dbLayoutCount: number; contentBlocksCount: number }
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to copy blocks')
      }

      // Update form state directly (no auto-save)
      if (data.blocks?.dbLayout) {
        dbLayoutField.setValue(data.blocks.dbLayout as Array<{ data?: Record<string, unknown> }>)
      }

      setCopySuccess(
        `Copied ${data.copied?.dbLayoutCount ?? 0} page builder blocks${
          (data.copied?.contentBlocksCount ?? 0) > 0
            ? ` and ${data.copied?.contentBlocksCount} content blocks`
            : ''
        }. Click Save to persist changes.`
      )

      // Clear success message after 5 seconds
      setTimeout(() => setCopySuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy blocks')
    } finally {
      setCopyingBlocks(false)
    }
  }, [pageId, dbLayoutField])

  const copyBlocksFromDefault = useCallback(() => {
    setShowCopyConfirm(true)
  }, [])

  // Determine if current page is the default locale
  const currentLocaleCode =
    typeof currentLocale === 'object' && currentLocale !== null
      ? currentLocale.code
      : undefined

  const isDefaultLocale =
    currentLocaleCode === reference?.defaultLocale.code ||
    (typeof currentLocale === 'string' || typeof currentLocale === 'number'
      ? String(currentLocale) === String(reference?.defaultLocale.id)
      : false)

  // Don't show for default locale pages
  if (isDefaultLocale) {
    return (
      <div className="field-type ui" style={{ marginTop: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
            marginBottom: 8,
          }}
        >
          Translate Content
        </label>
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)', margin: 0 }}>
          This is the default locale page. Open a translation to translate content.
        </p>
      </div>
    )
  }

  if (!translationGroupId) {
    return (
      <div className="field-type ui" style={{ marginTop: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
            marginBottom: 8,
          }}
        >
          Translate Content
        </label>
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)', margin: 0 }}>
          Save this page to enable translation interface.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="field-type ui" style={{ marginTop: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
            marginBottom: 8,
          }}
        >
          Translate Content
        </label>
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-400)', margin: 0 }}>
          Loading source content…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="field-type ui" style={{ marginTop: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
            marginBottom: 8,
          }}
        >
          Translate Content
        </label>
        <p style={{ fontSize: '12px', color: 'var(--theme-error-500)', margin: 0 }}>
          {error}
        </p>
        <AdminButton
          type="button"
          onClick={fetchReference}
          tone="bare"
          style={{ marginTop: 8, fontSize: '12px' }}
        >
          Retry
        </AdminButton>
      </div>
    )
  }

  if (!reference) {
    return null
  }

  const { page, defaultLocale } = reference

  return (
    <div className="field-type ui" style={{ marginTop: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-400)',
          marginBottom: 8,
        }}
      >
        Translate Content
      </label>

      <div
        style={{
          background: 'var(--theme-elevation-50, #f8f9fa)',
          border: '1px solid var(--theme-border-color)',
          borderRadius: 4,
          padding: 12,
          fontSize: '13px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--theme-border-color)',
          }}
        >
          {defaultLocale.flag && (
            <span style={{ fontSize: '16px' }}>{defaultLocale.flag}</span>
          )}
          <span style={{ fontWeight: 500 }}>{defaultLocale.name}</span>
          <span style={{ color: 'var(--theme-elevation-400)', fontSize: '11px' }}>
            ({defaultLocale.code}) → Current
          </span>
        </div>

        {/* Page Fields with Translation Inputs */}
        <div style={{ marginBottom: 16 }}>
          <TranslationRow
            label="Title"
            sourceValue={page.title}
            targetValue={titleField.value || ''}
            onTargetChange={(val) => titleField.setValue(val)}
          />
          <TranslationRow
            label="Slug"
            sourceValue={page.slug}
            targetValue={slugField.value || ''}
            onTargetChange={(val) => slugField.setValue(val)}
          />
          <TranslationRow
            label="Meta Title"
            sourceValue={page.seo?.metaTitle || ''}
            targetValue={metaTitleField.value || ''}
            onTargetChange={(val) => metaTitleField.setValue(val)}
            optional
          />
          <TranslationRow
            label="Meta Description"
            sourceValue={page.seo?.metaDescription || ''}
            targetValue={metaDescField.value || ''}
            onTargetChange={(val) => metaDescField.setValue(val)}
            optional
            multiline
          />
        </div>

        {/* Copy Blocks Section */}
        {reference?.page?.dbLayout && reference.page.dbLayout.length > 0 && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--theme-border-color)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--theme-elevation-400)',
                marginBottom: 8,
              }}
            >
              Page Builder Blocks
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--theme-elevation-500)',
                margin: '0 0 10px',
                lineHeight: 1.4,
              }}
            >
              Source has {reference.page.dbLayout.length} block(s). Copy to this page to translate block
              content.
            </p>

            {/* Confirmation Dialog */}
            {showCopyConfirm && (
              <div
                style={{
                  background: 'var(--theme-warning-50, #fffbeb)',
                  border: '1px solid var(--theme-warning-400, #f59e0b)',
                  borderRadius: 4,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--theme-warning-700, #b45309)',
                    marginBottom: 8,
                  }}
                >
                  ⚠️ Replace Existing Blocks?
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--theme-elevation-600)',
                    margin: '0 0 12px',
                    lineHeight: 1.4,
                  }}
                >
                  This will replace all existing blocks and their translations on this page.
                  Your current translations will be removed and replaced with content from the{' '}
                  {defaultLocale.name} (default) page.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <AdminButton
                    type="button"
                    onClick={() => setShowCopyConfirm(false)}
                    tone="bare"
                    style={{ flex: 1, fontSize: '12px' }}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    type="button"
                    onClick={doCopyBlocks}
                    disabled={copyingBlocks}
                    tone="primary"
                    style={{ flex: 1, fontSize: '12px' }}
                  >
                    {copyingBlocks ? 'Copying…' : 'Copy & Replace'}
                  </AdminButton>
                </div>
              </div>
            )}

            {!showCopyConfirm && (
              <AdminButton
                type="button"
                onClick={copyBlocksFromDefault}
                disabled={copyingBlocks}
                tone="primary"
                style={{ width: '100%', fontSize: '13px' }}
              >
                {copyingBlocks ? 'Copying…' : 'Copy Blocks from Source'}
              </AdminButton>
            )}

            {copySuccess && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: '12px',
                  color: 'var(--theme-success-500)',
                }}
              >
                ✓ {copySuccess}
              </p>
            )}

            {/* Block Content Translation */}
            <BlockTranslationSection
              sourceDbLayout={reference.page.dbLayout}
              targetDbLayout={currentBlockData}
              onFieldChange={(blockIndex, updatedData) =>
                formDispatch({ type: 'UPDATE', path: `dbLayout.${blockIndex}.data`, value: updatedData })
              }
            />
          </div>
        )}

        {/* AI Translate Section */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--theme-border-color)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--theme-elevation-400)',
              marginBottom: 6,
            }}
          >
            AI Translation
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--theme-elevation-500)',
              margin: '0 0 10px',
              lineHeight: 1.4,
            }}
          >
            Generate draft translations for title, SEO, and block content using Gemini AI. Review before saving.
          </p>

          <AdminButton
            type="button"
            onClick={doAiTranslate}
            disabled={aiTranslating}
            tone="primary"
            style={{ width: '100%', fontSize: '13px' }}
          >
            {aiTranslating ? 'Translating…' : '✨ Translate with AI'}
          </AdminButton>

          {aiError && (
            <p
              style={{
                marginTop: 8,
                fontSize: '12px',
                color: 'var(--theme-error-500)',
              }}
            >
              ✗ {aiError}
            </p>
          )}

          {aiSuccess && (
            <p
              style={{
                marginTop: 8,
                fontSize: '12px',
                color: 'var(--theme-success-500)',
              }}
            >
              ✓ {aiSuccess}
            </p>
          )}
        </div>

        {/* Info */}
        <p
          style={{
            marginTop: 12,
            fontSize: '11px',
            color: 'var(--theme-elevation-400)',
            lineHeight: 1.4,
          }}
        >
          Type translations in the fields above. Changes sync with the main form.
        </p>
      </div>
    </div>
  )
}

// ─── Translation Row Component ─────────────────────────────────────────────

function TranslationRow({
  label,
  sourceValue,
  targetValue,
  onTargetChange,
  optional = false,
  multiline = false,
}: {
  label: string
  sourceValue: string
  targetValue: string
  onTargetChange: (value: string) => void
  optional?: boolean
  multiline?: boolean
}) {
  const [isFocused, setIsFocused] = useState(false)

  const handleCopySource = () => {
    navigator.clipboard.writeText(sourceValue)
  }

  const handleCopyTarget = () => {
    navigator.clipboard.writeText(targetValue)
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '13px',
    fontFamily: 'inherit',
    border: isFocused
      ? '1px solid var(--theme-success-500)'
      : '1px solid var(--theme-border-color)',
    borderRadius: 3,
    background: 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    outline: 'none',
    resize: 'vertical',
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
          }}
        >
          {label}
          {optional && (
            <span style={{ fontWeight: 400, color: 'var(--theme-elevation-300)' }}>
              {' '}
              (optional)
            </span>
          )}
        </span>
      </div>

      {/* Source (Reference) */}
      <div
        style={{
          background: 'var(--theme-elevation-100)',
          border: '1px solid var(--theme-border-color)',
          borderRadius: 3,
          padding: '6px 8px',
          marginBottom: 6,
          fontSize: '12px',
          color: 'var(--theme-elevation-600)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <span style={{ flex: 1, wordBreak: 'break-word' }}>{sourceValue || '—'}</span>
        {sourceValue && (
          <button
            type="button"
            onClick={handleCopySource}
            style={{
              fontSize: '10px',
              color: 'var(--theme-success-500)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              whiteSpace: 'nowrap',
            }}
          >
            Copy
          </button>
        )}
      </div>

      {/* Target (Editable) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {multiline ? (
          <textarea
            value={targetValue}
            onChange={(e) => onTargetChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={3}
            style={inputStyles}
            placeholder={`Enter ${label.toLowerCase()} translation...`}
          />
        ) : (
          <input
            type="text"
            value={targetValue}
            onChange={(e) => onTargetChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={inputStyles}
            placeholder={`Enter ${label.toLowerCase()} translation...`}
          />
        )}
        {targetValue && (
          <button
            type="button"
            onClick={handleCopyTarget}
            style={{
              fontSize: '10px',
              color: 'var(--theme-success-500)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              whiteSpace: 'nowrap',
            }}
          >
            Copy
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Helper Functions ────────────────────────────────────────────────────────

type RawBlock = {
  blockDefinition?: unknown
  blockVersion?: unknown
  instanceId?: string
  label?: string
  hidden?: boolean
  anchor?: string
  data?: unknown
}

type DbLayoutRow = {
  blockDefinition?: string | number
  blockVersion?: string | number
  instanceId?: string
  label?: string
  hidden?: boolean
  anchor?: string
  data?: Record<string, unknown>
}

/** Coerce depth-2 populated relationship objects to plain IDs (matches copy-blocks-from-default). */
function extractRelId(val: unknown): string | number | undefined {
  if (val == null || val === '') return undefined
  if (typeof val === 'number') return val
  if (typeof val === 'string') return coerceRelationshipId(val)
  if (typeof val === 'object' && 'id' in (val as Record<string, unknown>)) {
    const id = (val as { id: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return coerceRelationshipId(id)
  }
  return undefined
}

function mapSourceBlockToRow(block: RawBlock): DbLayoutRow {
  return {
    blockDefinition: extractRelId(block.blockDefinition),
    blockVersion: extractRelId(block.blockVersion),
    instanceId: block.instanceId,
    label: block.label,
    hidden: block.hidden ?? false,
    anchor: block.anchor,
    data: normalizeBlockData(block.data),
  }
}

function normalizeDbLayoutRow(row: DbLayoutRow, sourceBlock?: RawBlock): DbLayoutRow {
  return {
    blockDefinition: extractRelId(row.blockDefinition) ?? extractRelId(sourceBlock?.blockDefinition),
    blockVersion: extractRelId(row.blockVersion) ?? extractRelId(sourceBlock?.blockVersion),
    instanceId: row.instanceId ?? sourceBlock?.instanceId,
    label: row.label ?? sourceBlock?.label,
    hidden: row.hidden ?? sourceBlock?.hidden ?? false,
    anchor: row.anchor ?? sourceBlock?.anchor,
    data: normalizeBlockData(row.data),
  }
}

function extractAllStrings(
  obj: unknown,
  prefix = '',
  result: { path: string; value: string }[] = []
): { path: string; value: string }[] {
  if (typeof obj === 'string' && obj.trim()) {
    // Skip IDs, URLs, and very short strings
    if (
      obj.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
      obj.match(/^https?:\/\//) ||
      obj.match(/^[a-z0-9_-]+\.(jpg|jpeg|png|gif|svg|webp)$/i) ||
      obj.length < 2
    ) {
      return result
    }
    result.push({ path: prefix, value: obj })
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      extractAllStrings(item, prefix ? `${prefix} › ${index}` : String(index), result)
    })
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix} › ${key}` : key
      extractAllStrings(value, newPrefix, result)
    }
  }
  return result
}

function getValueByPath(obj: unknown, path: string): string {
  const keys = path.split(' › ')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined) return ''
    if (typeof current !== 'object') return ''
    if (Array.isArray(current)) {
      current = (current as unknown[])[parseInt(key, 10)]
    } else {
      current = (current as Record<string, unknown>)[key]
    }
  }
  return typeof current === 'string' ? current : ''
}

function setValueByPath(obj: unknown, path: string, value: string): boolean {
  const keys = path.split(' › ')
  let current: unknown = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (current === null || current === undefined) return false
    if (typeof current !== 'object') return false
    const key = keys[i]
    if (Array.isArray(current)) {
      current = (current as unknown[])[parseInt(key, 10)]
    } else {
      current = (current as Record<string, unknown>)[key]
    }
  }
  const lastKey = keys[keys.length - 1]
  if (current && typeof current === 'object') {
    if (Array.isArray(current)) {
      ;(current as unknown[])[parseInt(lastKey, 10)] = value
    } else {
      ;(current as Record<string, unknown>)[lastKey] = value
    }
    return true
  }
  return false
}

// ─── Block Translation Section ─────────────────────────────────────────────

function BlockTranslationSection({
  sourceDbLayout,
  targetDbLayout,
  onFieldChange,
}: {
  sourceDbLayout?: unknown[]
  targetDbLayout?: Array<{ data?: Record<string, unknown> }>
  onFieldChange: (blockIndex: number, updatedData: Record<string, unknown>) => void
}) {
  const [showAll, setShowAll] = useState(false)

  if (!sourceDbLayout || sourceDbLayout.length === 0) return null

  // Extract all strings from source blocks
  const allFields: { blockIndex: number; path: string; value: string }[] = []
  sourceDbLayout.forEach((block, index) => {
    if (typeof block === 'object' && block !== null) {
      const blockData = (block as { data?: Record<string, unknown> }).data
      if (blockData) {
        const strings = extractAllStrings(blockData)
        strings.forEach(({ path, value }) => {
          allFields.push({ blockIndex: index, path, value })
        })
      }
    }
  })

  if (allFields.length === 0) return null

  const layoutToRead = Array.isArray(targetDbLayout) ? targetDbLayout : []

  const displayFields = showAll ? allFields : allFields.slice(0, 6)

  const handleFieldChange = (blockIndex: number, path: string, newValue: string) => {
    const sourceBlock = sourceDbLayout[blockIndex] as { data?: Record<string, unknown> }
    const currentData = layoutToRead[blockIndex]?.data
    // Use current translated data if present, otherwise seed from source to preserve all fields
    const base =
      currentData && Object.keys(currentData).length > 0
        ? JSON.parse(JSON.stringify(currentData))
        : JSON.parse(JSON.stringify(sourceBlock?.data || {}))
    setValueByPath(base, path, newValue)
    onFieldChange(blockIndex, base)
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--theme-border-color)' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-400)',
          marginBottom: 12,
        }}
      >
        Block Content Translation
      </div>

      {displayFields.map(({ blockIndex, path, value }) => {
        const targetBlock = Array.isArray(layoutToRead) ? layoutToRead[blockIndex] : undefined
        const normalizedTargetData = targetBlock?.data ? normalizeBlockData(targetBlock.data) : undefined
        const rawTargetValue = getValueByPath(normalizedTargetData, path)
        const targetValue = rawTargetValue !== '' ? rawTargetValue : ''

        const sourceBlock = sourceDbLayout?.[blockIndex] as { data?: Record<string, unknown> }
        const sourceValue = getValueByPath(sourceBlock?.data, path)
        const label = `Block ${blockIndex + 1} › ${path}`

        return (
          <div key={`${blockIndex}-${path}`} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--theme-elevation-400)',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            {sourceValue ? (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--theme-elevation-500)',
                  marginBottom: 6,
                }}
              >
                Source: {sourceValue}
              </div>
            ) : null}
            <input
              type="text"
              value={targetValue}
              onChange={(e) => handleFieldChange(blockIndex, path, e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '13px',
                fontFamily: 'inherit',
                border: '1px solid var(--theme-border-color)',
                borderRadius: 3,
                background: 'var(--theme-elevation-0)',
                color: 'var(--theme-text)',
                outline: 'none',
              }}
            />
          </div>
        )
      })}

      {allFields.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          style={{
            fontSize: '12px',
            color: 'var(--theme-success-500)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          {showAll ? 'Show Less' : `Show ${allFields.length - 6} More`}
        </button>
      )}
    </div>
  )
}
