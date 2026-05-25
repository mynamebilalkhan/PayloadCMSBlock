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

interface PendingBlockDataUpdate {
  id: string
  blockIndex: number
  data: Record<string, unknown>
}

interface PendingContentBlockUpdate {
  id: string
  formPath: string
  value: string
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

  // Read contentBlocks live from the form so newly added blocks appear in the sidebar
  // without requiring a reference-page fetch.
  const currentContentBlockData = useFormFields(([fields]) => {
    const blocks: Array<Record<string, unknown>> = []
    for (const [key, fieldState] of Object.entries(fields)) {
      const val = (fieldState as { value?: unknown }).value
      // top-level field: contentBlocks.N.fieldName
      const topMatch = key.match(/^contentBlocks\.(\d+)\.([^.]+)$/)
      if (topMatch) {
        const bi = parseInt(topMatch[1], 10)
        const fn = topMatch[2]
        while (blocks.length <= bi) blocks.push({})
        blocks[bi][fn] = val
        continue
      }
      // nested array field: contentBlocks.N.arrayField.M.fieldName
      const nestedMatch = key.match(/^contentBlocks\.(\d+)\.([^.]+)\.(\d+)\.([^.]+)$/)
      if (nestedMatch) {
        const bi = parseInt(nestedMatch[1], 10)
        const af = nestedMatch[2]
        const ii = parseInt(nestedMatch[3], 10)
        const fn = nestedMatch[4]
        while (blocks.length <= bi) blocks.push({})
        if (!Array.isArray(blocks[bi][af])) blocks[bi][af] = []
        const arr = blocks[bi][af] as Array<Record<string, unknown>>
        while (arr.length <= ii) arr.push({})
        arr[ii][fn] = val
      }
    }
    return blocks
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
  const [pendingBlockDataUpdates, setPendingBlockDataUpdates] = useState<PendingBlockDataUpdate[]>([])
  const [pendingContentBlockUpdates, setPendingContentBlockUpdates] = useState<PendingContentBlockUpdate[]>([])

  // Form field bindings for direct editing
  const titleField = useField<string>({ path: 'title' })
  const slugField = useField<string>({ path: 'slug' })
  const metaTitleField = useField<string>({ path: 'seo.metaTitle' })
  const metaDescField = useField<string>({ path: 'seo.metaDescription' })
  const dbLayoutField = useField<Array<{ data?: Record<string, unknown> }>>({ path: 'dbLayout' })

  // Stable refs so async callbacks always call the latest setValue
  const metaTitleSetValueRef = useRef(metaTitleField.setValue)
  const metaDescSetValueRef = useRef(metaDescField.setValue)
  const dbLayoutSetValueRef = useRef(dbLayoutField.setValue)

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

      // ── 2b. Collect content block strings ────────────────────────────────
      const contentBlockFieldKeys: Array<{ formPath: string; contentKey: string }> = []

      if (page.contentBlocks && page.contentBlocks.length > 0) {
        page.contentBlocks.forEach((block, blockIndex) => {
          if (typeof block === 'object' && block !== null) {
            const fields = extractContentBlockFields(block as Record<string, unknown>, blockIndex)
            fields.forEach(({ formPath, sourceValue }) => {
              if (sourceValue.trim().length > 1) {
                const contentKey = `__cb__${formPath}`
                content[contentKey] = sourceValue
                contentBlockFieldKeys.push({ formPath, contentKey })
              }
            })
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
      if (translated['seo.metaTitle']) metaTitleSetValueRef.current(translated['seo.metaTitle'])
      if (translated['seo.metaDescription']) metaDescSetValueRef.current(translated['seo.metaDescription'])
      if (newLayout) {
        // Apply block data through per-field useField().setValue() bridges so Payload
        // marks the form dirty and enables Save.
        setPendingBlockDataUpdates(
          newLayout
            .map((row, i) =>
              row.data
                ? { id: `${Date.now()}-${i}`, blockIndex: i, data: row.data }
                : null,
            )
            .filter((row): row is PendingBlockDataUpdate => Boolean(row)),
        )
      }

      if (contentBlockFieldKeys.length > 0) {
        const cbUpdates: PendingContentBlockUpdate[] = []
        for (const { formPath, contentKey } of contentBlockFieldKeys) {
          const translatedValue = translated[contentKey]
          if (translatedValue) {
            cbUpdates.push({ id: `cb-${Date.now()}-${formPath}`, formPath, value: translatedValue })
          }
        }
        if (cbUpdates.length > 0) setPendingContentBlockUpdates(cbUpdates)
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

  const sourceLocaleCode = defaultLocale.code
  const targetLocaleCode =
    typeof currentLocale === 'object' && currentLocale !== null
      ? currentLocale.code
      : currentLocale !== undefined && currentLocale !== null
        ? String(currentLocale)
        : undefined

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
          <LocaleLockedFieldNote
            label="Page title"
            currentValue={titleField.value || ''}
            hint="Edit in the Hero tab. Not copied or translated from the reference locale."
          />
          <LocaleLockedFieldNote
            label="Slug"
            currentValue={slugField.value || ''}
            hint="Edit in the sidebar. Same URL path per locale is typical; not auto-translated."
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
              sourceLocaleCode={sourceLocaleCode}
              targetLocaleCode={targetLocaleCode}
            />

            {/* Content Block Translation */}
            <ContentBlockTranslationSection
              sourceContentBlocks={reference.page.contentBlocks}
              targetContentBlocks={currentContentBlockData}
              sourceLocaleCode={sourceLocaleCode}
              targetLocaleCode={targetLocaleCode}
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
            Generate draft translations for SEO and block content using Gemini AI. Page title and slug are set per locale in the sidebar — not auto-translated.
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

        {pendingBlockDataUpdates.map((update) => (
          <BlockDataUpdateBridge
            key={update.id}
            update={update}
            onApplied={(id) =>
              setPendingBlockDataUpdates((updates) => updates.filter((item) => item.id !== id))
            }
          />
        ))}

        {pendingContentBlockUpdates.map((update) => (
          <ContentBlockSingleFieldBridge
            key={update.id}
            update={update}
            onApplied={(id) =>
              setPendingContentBlockUpdates((updates) => updates.filter((item) => item.id !== id))
            }
          />
        ))}

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

// ─── Locale-locked fields (title / slug) ───────────────────────────────────

function LocaleLockedFieldNote({
  label,
  currentValue,
  hint,
}: {
  label: string
  currentValue: string
  hint: string
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: '8px 10px',
        borderRadius: 3,
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50, #f9fafb)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500)',
          marginBottom: 4,
        }}
      >
        {label}
        <span style={{ fontWeight: 400, marginLeft: 6, color: 'var(--theme-elevation-400)' }}>
          (per locale)
        </span>
      </div>
      <div
        style={{
          fontSize: '13px',
          color: currentValue ? 'var(--theme-text)' : 'var(--theme-elevation-400)',
          fontStyle: currentValue ? 'normal' : 'italic',
        }}
      >
        {currentValue || 'Not set yet'}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--theme-elevation-500)', margin: '6px 0 0', lineHeight: 1.4 }}>
        {hint}
      </p>
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

function BlockDataUpdateBridge({
  update,
  onApplied,
}: {
  update: PendingBlockDataUpdate
  onApplied: (id: string) => void
}) {
  const { setValue } = useField<Record<string, unknown>>({ path: `dbLayout.${update.blockIndex}.data` })

  useEffect(() => {
    setValue(update.data)
    onApplied(update.id)
  }, [onApplied, setValue, update])

  return null
}

function BlockTranslationInput({
  blockIndex,
  path,
  sourceDbLayout,
  fallbackTargetData,
  sourceLocaleCode,
  targetLocaleCode,
}: {
  blockIndex: number
  path: string
  sourceDbLayout: unknown[]
  fallbackTargetData?: Record<string, unknown>
  sourceLocaleCode?: string
  targetLocaleCode?: string
}) {
  const { value, setValue } = useField<Record<string, unknown>>({ path: `dbLayout.${blockIndex}.data` })
  const [translating, setTranslating] = useState(false)

  const sourceBlock = sourceDbLayout?.[blockIndex] as { data?: Record<string, unknown> } | undefined
  const normalizedTargetData = normalizeBlockData(value ?? fallbackTargetData)
  const rawTargetValue = getValueByPath(normalizedTargetData, path)
  const targetValue = rawTargetValue !== '' ? rawTargetValue : ''
  const sourceValue = getValueByPath(sourceBlock?.data, path)
  const label = `Block ${blockIndex + 1} > ${path}`

  const handleChange = (newValue: string) => {
    const currentData = normalizeBlockData(value ?? fallbackTargetData)
    const base =
      Object.keys(currentData).length > 0
        ? JSON.parse(JSON.stringify(currentData))
        : JSON.parse(JSON.stringify(sourceBlock?.data || {}))

    setValueByPath(base, path, newValue)
    setValue(base)
  }

  const valueToTranslate = sourceValue || targetValue

  const handleAiTranslate = async () => {
    if (!valueToTranslate || !sourceLocaleCode || !targetLocaleCode) return
    setTranslating(true)
    try {
      const result = await aiTranslateSingleField(sourceLocaleCode, targetLocaleCode, valueToTranslate)
      if (result) handleChange(result)
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
          }}
        >
          {label}
        </div>
        {sourceLocaleCode && targetLocaleCode && valueToTranslate && (
          <button
            type="button"
            onClick={handleAiTranslate}
            disabled={translating}
            title="Translate this field with AI"
            style={{
              fontSize: '11px',
              background: 'none',
              border: 'none',
              cursor: translating ? 'default' : 'pointer',
              color: translating ? 'var(--theme-elevation-400)' : 'var(--theme-success-500)',
              padding: '0 2px',
              lineHeight: 1,
            }}
          >
            {translating ? '…' : '✨'}
          </button>
        )}
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
        onChange={(e) => handleChange(e.target.value)}
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
}

async function aiTranslateSingleField(
  sourceLocaleCode: string,
  targetLocaleCode: string,
  sourceValue: string,
): Promise<string | null> {
  const res = await fetch('/api/admin/ai-translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      sourceLocale: sourceLocaleCode,
      targetLocale: targetLocaleCode,
      content: { field: sourceValue },
    }),
  })
  const data = (await res.json()) as { translated?: Record<string, string>; error?: string }
  if (!res.ok || !data.translated?.field) return null
  return data.translated.field
}

function ContentBlockSingleFieldBridge({
  update,
  onApplied,
}: {
  update: PendingContentBlockUpdate
  onApplied: (id: string) => void
}) {
  const { setValue } = useField<string>({ path: update.formPath })

  useEffect(() => {
    setValue(update.value)
    onApplied(update.id)
  }, [onApplied, setValue, update])

  return null
}

// ─── Content Block Helpers ────────────────────────────────────────────────

const SKIP_CONTENT_BLOCK_FIELDS = new Set(['id', 'blockType', 'blockName'])

function extractContentBlockFields(
  block: Record<string, unknown>,
  blockIndex: number,
): { formPath: string; label: string; sourceValue: string; multiline?: boolean }[] {
  const results: { formPath: string; label: string; sourceValue: string; multiline?: boolean }[] = []

  for (const [key, value] of Object.entries(block)) {
    if (SKIP_CONTENT_BLOCK_FIELDS.has(key)) continue

    if (typeof value === 'string' && value.trim()) {
      results.push({
        formPath: `contentBlocks.${blockIndex}.${key}`,
        label: `Block ${blockIndex + 1} > ${key.toUpperCase()}`,
        sourceValue: value,
      })
    } else if (Array.isArray(value)) {
      value.forEach((item, itemIndex) => {
        if (typeof item !== 'object' || item === null) return
        for (const [itemKey, itemValue] of Object.entries(item as Record<string, unknown>)) {
          if (itemKey === 'id') continue
          if (typeof itemValue === 'string' && itemValue.trim()) {
            results.push({
              formPath: `contentBlocks.${blockIndex}.${key}.${itemIndex}.${itemKey}`,
              label: `Block ${blockIndex + 1} > Item ${itemIndex + 1} > ${itemKey.toUpperCase()}`,
              sourceValue: itemValue,
              multiline: itemKey === 'testimonial' || itemValue.length > 80,
            })
          }
        }
      })
    }
  }

  return results
}

// ─── Content Block Translation Input ─────────────────────────────────────

function ContentBlockTranslationInput({
  formPath,
  label,
  sourceValue,
  multiline,
  sourceLocaleCode,
  targetLocaleCode,
}: {
  formPath: string
  label: string
  sourceValue: string
  multiline?: boolean
  sourceLocaleCode?: string
  targetLocaleCode?: string
}) {
  const { value, setValue } = useField<string>({ path: formPath })
  const [translating, setTranslating] = useState(false)

  const valueToTranslate = sourceValue || value || ''

  const handleAiTranslate = async () => {
    if (!valueToTranslate || !sourceLocaleCode || !targetLocaleCode) return
    setTranslating(true)
    try {
      const result = await aiTranslateSingleField(sourceLocaleCode, targetLocaleCode, valueToTranslate)
      if (result) setValue(result)
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-400)',
          }}
        >
          {label}
        </div>
        {sourceLocaleCode && targetLocaleCode && valueToTranslate && (
          <button
            type="button"
            onClick={handleAiTranslate}
            disabled={translating}
            title="Translate this field with AI"
            style={{
              fontSize: '11px',
              background: 'none',
              border: 'none',
              cursor: translating ? 'default' : 'pointer',
              color: translating ? 'var(--theme-elevation-400)' : 'var(--theme-success-500)',
              padding: '0 2px',
              lineHeight: 1,
            }}
          >
            {translating ? '…' : '✨'}
          </button>
        )}
      </div>
      {sourceValue ? (
        <div style={{ fontSize: '11px', color: 'var(--theme-elevation-500)', marginBottom: 6 }}>
          Source: {sourceValue}
        </div>
      ) : null}
      {multiline ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
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
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value)}
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
      )}
    </div>
  )
}

// ─── Content Block Translation Section ───────────────────────────────────

function ContentBlockTranslationSection({
  sourceContentBlocks,
  targetContentBlocks,
  sourceLocaleCode,
  targetLocaleCode,
}: {
  sourceContentBlocks?: unknown[]
  targetContentBlocks?: unknown[]
  sourceLocaleCode?: string
  targetLocaleCode?: string
}) {
  const [showAll, setShowAll] = useState(false)

  const sourceLen = Array.isArray(sourceContentBlocks) ? sourceContentBlocks.length : 0
  const targetLen = Array.isArray(targetContentBlocks) ? targetContentBlocks.length : 0
  const maxLen = Math.max(sourceLen, targetLen)

  if (maxLen === 0) return null

  const allFields: ReturnType<typeof extractContentBlockFields> = []

  for (let index = 0; index < maxLen; index++) {
    const sourceBlock = Array.isArray(sourceContentBlocks) ? sourceContentBlocks[index] : undefined
    const targetBlock = Array.isArray(targetContentBlocks) ? targetContentBlocks[index] : undefined

    if (typeof sourceBlock === 'object' && sourceBlock !== null) {
      // Source exists: use it for field paths and source values (normal case).
      const fields = extractContentBlockFields(sourceBlock as Record<string, unknown>, index)
      allFields.push(...fields)
    } else if (typeof targetBlock === 'object' && targetBlock !== null) {
      // Target-only (new block added on this locale): extract paths from target,
      // but show no source value since there is no source-locale version.
      const fields = extractContentBlockFields(targetBlock as Record<string, unknown>, index)
      allFields.push(...fields.map((f) => ({ ...f, sourceValue: '' })))
    }
  }

  if (allFields.length === 0) return null

  const displayFields = showAll ? allFields : allFields.slice(0, 6)

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
        Content Block Translation
      </div>

      {displayFields.map(({ formPath, label, sourceValue, multiline }) => (
        <ContentBlockTranslationInput
          key={formPath}
          formPath={formPath}
          label={label}
          sourceValue={sourceValue}
          multiline={multiline}
          sourceLocaleCode={sourceLocaleCode}
          targetLocaleCode={targetLocaleCode}
        />
      ))}

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

// ─── Block Translation Section ─────────────────────────────────────────────

function BlockTranslationSection({
  sourceDbLayout,
  targetDbLayout,
  sourceLocaleCode,
  targetLocaleCode,
}: {
  sourceDbLayout?: unknown[]
  targetDbLayout?: Array<{ data?: Record<string, unknown> }>
  sourceLocaleCode?: string
  targetLocaleCode?: string
}) {
  const [showAll, setShowAll] = useState(false)

  const layoutToRead = Array.isArray(targetDbLayout) ? targetDbLayout : []
  const maxLen = Math.max(
    Array.isArray(sourceDbLayout) ? sourceDbLayout.length : 0,
    layoutToRead.length,
  )

  if (maxLen === 0) return null

  // Extract strings from source blocks; fall back to target data for newly added blocks.
  const allFields: { blockIndex: number; path: string; value: string }[] = []
  for (let index = 0; index < maxLen; index++) {
    const sourceBlock = Array.isArray(sourceDbLayout) ? sourceDbLayout[index] : undefined
    const targetBlock = layoutToRead[index]
    const blockData =
      (sourceBlock as { data?: Record<string, unknown> } | undefined)?.data ??
      targetBlock?.data
    if (blockData) {
      extractAllStrings(blockData).forEach(({ path, value }) => {
        allFields.push({ blockIndex: index, path, value })
      })
    }
  }

  if (allFields.length === 0) return null

  const displayFields = showAll ? allFields : allFields.slice(0, 6)

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

      {displayFields.map(({ blockIndex, path }) => (
        <BlockTranslationInput
          key={`${blockIndex}-${path}`}
          blockIndex={blockIndex}
          path={path}
          sourceDbLayout={sourceDbLayout ?? []}
          fallbackTargetData={layoutToRead[blockIndex]?.data}
          sourceLocaleCode={sourceLocaleCode}
          targetLocaleCode={targetLocaleCode}
        />
      ))}

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
