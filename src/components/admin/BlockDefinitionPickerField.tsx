'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  useField,
} from '@payloadcms/ui'
import type { RelationshipFieldClientComponent } from 'payload'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'
import { BlockPreviewImage } from '@/components/admin/BlockPreviewImage'
import {
  InsertBlockModal,
  type BlockDefinitionDoc,
} from '@/components/BlockDataField/InsertBlockModal'
import { normalizeBlockData } from '@/lib/blockData/normalizeBlockData'
import { coerceRelationshipId } from '@/lib/payload/coerceRelationshipId'

function SelectedBlockCard({
  block,
  readOnly,
  onChange,
  onClear,
}: {
  block: BlockDefinitionDoc
  readOnly?: boolean
  onChange: () => void
  onClear: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'flex-start',
        padding: '0.75rem',
        border: '1px solid var(--theme-elevation-200, #e5e7eb)',
        borderRadius: '0.5rem',
        background: 'var(--theme-elevation-50, #f9fafb)',
      }}
    >
      <BlockPreviewImage block={block} width={88} height={56} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--theme-text, #111827)' }}>
          {block.name}
        </div>
        {block.description && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--theme-elevation-500, #6b7280)',
              marginTop: '0.2rem',
              lineHeight: 1.4,
            }}
          >
            {block.description}
          </div>
        )}
        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onChange}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#4338ca',
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Change section type
            </button>
            <button
              type="button"
              onClick={onClear}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--theme-elevation-600, #4b5563)',
                background: 'transparent',
                border: '1px solid var(--theme-elevation-200, #e5e7eb)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const BlockDefinitionPickerFieldContent: RelationshipFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
}) => {
  const {
    admin: { description } = {},
    label,
    required,
  } = field

  const { disabled, path, setValue, showError, value } = useField<
    string | number | BlockDefinitionDoc | null
  >({
    potentiallyStalePath: pathFromProps,
  })

  const fieldPath = path ?? pathFromProps ?? field.name
  const versionPath = fieldPath.replace(/\.blockDefinition$/, '.blockVersion')
  const dataPath = fieldPath.replace(/\.blockDefinition$/, '.data')

  const { setValue: setBlockVersion } = useField<string | number | null>({ path: versionPath })
  const { setValue: setBlockData, value: blockDataValue } = useField<Record<string, unknown>>({
    path: dataPath,
  })

  const isReadOnly = readOnly || disabled
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<BlockDefinitionDoc | null>(null)
  const [loadingBlock, setLoadingBlock] = useState(false)

  const rawSelectedId =
    typeof value === 'object' && value !== null && 'id' in value
      ? (value as BlockDefinitionDoc).id
      : value

  const selectedId =
    rawSelectedId == null || rawSelectedId === ''
      ? null
      : coerceRelationshipId(rawSelectedId as string | number)

  const fetchBlock = useCallback(async (id: string | number) => {
    setLoadingBlock(true)
    try {
      const res = await fetch(`/api/block-definitions/${id}?depth=2`, { credentials: 'same-origin' })
      if (!res.ok) {
        setSelectedBlock(null)
        return
      }
      const doc = (await res.json()) as BlockDefinitionDoc
      setSelectedBlock(doc)
    } catch {
      setSelectedBlock(null)
    } finally {
      setLoadingBlock(false)
    }
  }, [])

  useEffect(() => {
    if (typeof value === 'object' && value !== null && 'name' in value) {
      setSelectedBlock(value as BlockDefinitionDoc)
      return
    }
    if (selectedId == null) {
      setSelectedBlock(null)
      return
    }
    void fetchBlock(selectedId)
  }, [value, selectedId, fetchBlock])

  const handleSelectBlock = useCallback(
    (block: BlockDefinitionDoc, presetData?: Record<string, unknown>) => {
      setValue(block.id)
      const versionId = block.currentVersion?.id
      if (versionId != null) {
        setBlockVersion(versionId)
      }

      const preset = presetData ? normalizeBlockData(presetData) : null
      const current = normalizeBlockData(blockDataValue)
      if (preset && Object.keys(current).length === 0) {
        setBlockData(preset)
      }
      setSelectedBlock(block)
    },
    [setValue, setBlockVersion, setBlockData, blockDataValue],
  )

  const handleClear = useCallback(() => {
    setValue(null)
    setBlockVersion(null)
    setSelectedBlock(null)
  }, [setValue, setBlockVersion])

  return (
    <div className="field-type relationship">
      <FieldLabel htmlFor={`field-${fieldPath.replace(/\./g, '__')}`} label={label} required={required} />
      {description && <FieldDescription description={description} path={fieldPath} />}

      {loadingBlock && !selectedBlock && selectedId != null && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500, #6b7280)' }}>
          Loading section type…
        </p>
      )}

      {selectedBlock ? (
        <SelectedBlockCard
          block={selectedBlock}
          readOnly={isReadOnly}
          onChange={() => setModalOpen(true)}
          onClear={handleClear}
        />
      ) : (
        !isReadOnly && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#6366f1',
              background: '#f0f0ff',
              border: '1.5px dashed #a5b4fc',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Choose section type
          </button>
        )
      )}

      {isReadOnly && !selectedBlock && selectedId == null && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-400, #9ca3af)' }}>—</p>
      )}

      <FieldError path={fieldPath} showError={showError} />

      <InsertBlockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelectBlock={handleSelectBlock}
        title="Choose section type"
        subtitle="Pick a section for this row. Upload thumbnails on each block definition for previews."
      />
    </div>
  )
}

export const BlockDefinitionPickerField: RelationshipFieldClientComponent = (props) => (
  <ClientOnlyAdminField>
    <BlockDefinitionPickerFieldContent {...props} />
  </ClientOnlyAdminField>
)
