'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import type { BlockSchema } from '@/validation/types'
import { SchemaForm } from './SchemaForm'
import {
  coerceRelationshipId,
  normalizeBlockData,
  stripUnknownKeys,
} from './blockDataUtils'

type Props = {
  path: string
  readOnly?: boolean
}

export function BlockDataField({ path, readOnly }: Props) {
  const { value, setValue } = useField<Record<string, unknown>>({ path })

  const versionPath = path.replace(/\.data$/, '.blockVersion')

  const formFieldSlice = useFormFields(([fields]) => ({
    dataField: fields[path],
    versionField: fields[versionPath],
  }))

  const blockVersionId = useFormFields(([fields]) =>
    coerceRelationshipId(fields[versionPath]?.value),
  )

  const [schema, setSchema] = useState<BlockSchema | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formData = useMemo(() => normalizeBlockData(value), [value])
  const formDataFromSlice = useMemo(
    () => normalizeBlockData(formFieldSlice?.dataField?.value),
    [formFieldSlice],
  )
  const formDataRef = useRef(formData)
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  const lastCleanedVersionRef = useRef<string | null>(null)

  /** Only write back when stripping orphan keys — never when data has not hydrated yet. */
  const applySchemaCleanup = useCallback(
    (current: Record<string, unknown>, nextSchema: BlockSchema, versionKey: string) => {
      if (Object.keys(current).length === 0) return

      const { cleaned, removedKeys } = stripUnknownKeys(current, nextSchema)
      if (removedKeys.length === 0) {
        lastCleanedVersionRef.current = versionKey
        return
      }

      lastCleanedVersionRef.current = versionKey
      setValue(cleaned)
    },
    [setValue],
  )

  useEffect(() => {
    if (!blockVersionId) {
      setSchema(null)
      lastCleanedVersionRef.current = null
      return
    }

    lastCleanedVersionRef.current = null

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/block-definition-versions/${blockVersionId}?depth=0`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((doc) => {
        if (cancelled) return
        if (!doc?.schema) {
          setError('Version has no schema.')
          return
        }

        const newSchema = doc.schema as BlockSchema
        setSchema(newSchema)

        applySchemaCleanup(formDataRef.current, newSchema, String(blockVersionId))
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [blockVersionId, applySchemaCleanup])

  // If block data hydrates after the schema fetch, run orphan-key cleanup once.
  useEffect(() => {
    if (!schema || !blockVersionId) return
    const versionKey = String(blockVersionId)
    if (lastCleanedVersionRef.current === versionKey) return
    if (Object.keys(formData).length === 0) return

    applySchemaCleanup(formData, schema, versionKey)
  }, [formData, schema, blockVersionId, applySchemaCleanup])

  const handleChange = useCallback(
    (next: Record<string, unknown>) => {
      if (schema) {
        const { cleaned } = stripUnknownKeys(next, schema)
        setValue(cleaned)
      } else {
        setValue(next)
      }
    },
    [schema, setValue],
  )

  return (
    <div style={{ marginTop: '1rem' }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
          color: 'var(--theme-elevation-500, #6b7280)',
        }}
      >
        Block Data
      </div>

      {!blockVersionId && (
        <p style={{ color: 'var(--theme-elevation-400, #9ca3af)', fontSize: '0.875rem' }}>
          Select a Block Version above to reveal form fields.
        </p>
      )}

      {blockVersionId && loading && (
        <p style={{ color: 'var(--theme-elevation-400, #9ca3af)', fontSize: '0.875rem' }}>
          Loading schema…
        </p>
      )}

      {blockVersionId && error && (
        <p style={{ color: 'var(--theme-error-500, #ef4444)', fontSize: '0.875rem' }}>
          {error}
        </p>
      )}

      {blockVersionId && !loading && schema && (
        <div
          style={{
            border: '1px solid var(--theme-elevation-150, #e5e7eb)',
            borderRadius: '0.375rem',
            padding: '1rem',
            background: 'var(--theme-elevation-50, #f9fafb)',
          }}
        >
          <SchemaForm
            schema={schema}
            value={formData}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}
