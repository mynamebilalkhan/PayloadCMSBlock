'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { RenderLexical, buildEditorState } from '@payloadcms/richtext-lexical/client'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  DYNAMIC_BLOCK_RICHTEXT_SCHEMA_PATH,
  isLexicalState,
  normalizeRichTextValue,
} from '@/lib/richText'

type Props = {
  fieldName: string
  label?: string
  required?: boolean
  description?: string
  value: unknown
  onChange: (value: unknown) => void
  readOnly?: boolean
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 500,
  fontSize: '0.8125rem',
  marginBottom: '0.25rem',
  color: 'var(--theme-elevation-800)',
}

const descStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--theme-elevation-500)',
  marginTop: '0.25rem',
}

export function RichTextInput({
  fieldName,
  label,
  required,
  description,
  value,
  onChange,
  readOnly,
}: Props) {
  const [editorValue, setEditorValue] = useState<DefaultTypedEditorState | undefined>()
  const [ready, setReady] = useState(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let cancelled = false

    async function sync() {
      if (isLexicalState(value)) {
        if (!cancelled) {
          setEditorValue(value)
          setReady(true)
        }
        return
      }

      const normalized = await normalizeRichTextValue(value)
      if (cancelled) return

      setEditorValue(normalized)
      setReady(true)

      // Persist migration from legacy HTML string → Lexical JSON
      if (typeof value === 'string' && value.trim()) {
        onChangeRef.current(normalized)
      }
    }

    void sync()
    return () => {
      cancelled = true
    }
  }, [value])

  const handleSetValue = useCallback(
    (next: DefaultTypedEditorState | undefined) => {
      const state = next ?? buildEditorState({ text: '' })
      setEditorValue(state)
      onChange(state)
    },
    [onChange],
  )

  return (
    <div>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: 'var(--theme-error-500, #ef4444)', marginLeft: '0.25rem' }}>
              *
            </span>
          )}
        </label>
      )}

      <div
        style={{
          border: '1px solid var(--theme-elevation-150, #e5e7eb)',
          borderRadius: '0.375rem',
          background: 'var(--theme-elevation-0, #fff)',
          minHeight: '8rem',
        }}
      >
        {!ready || !editorValue ? (
          <p
            style={{
              padding: '1rem',
              fontSize: '0.875rem',
              color: 'var(--theme-elevation-400, #9ca3af)',
            }}
          >
            Loading editor…
          </p>
        ) : (
          <RenderLexical
            field={{ name: fieldName, admin: { readOnly } }}
            schemaPath={DYNAMIC_BLOCK_RICHTEXT_SCHEMA_PATH}
            path={fieldName}
            value={editorValue}
            setValue={handleSetValue as Parameters<typeof RenderLexical>[0]['setValue']}
            initialValue={editorValue}
          />
        )}
      </div>

      {description && <p style={descStyle}>{description}</p>}
    </div>
  )
}
