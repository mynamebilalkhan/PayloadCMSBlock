'use client'

import React, { useCallback } from 'react'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  fieldBaseClass,
  useField,
} from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'

/** Normalize to #rrggbb for native color input and preview swatch. */
function toPickerHex(value: string | undefined, fallback: string): string {
  const fb = toPickerHexStrict(fallback) ?? '#000000'
  return toPickerHexStrict(value) ?? fb
}

function toPickerHexStrict(value: string | undefined): string | null {
  if (!value || typeof value !== 'string') return null
  const v = value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const [, r, g, b] = v
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return null
}

const ColorPickerFieldContent: TextFieldClientComponent = ({ field, path: pathFromProps, readOnly }) => {
  const {
    admin: { description } = {},
    defaultValue,
    label,
    required,
  } = field

  const fallback = typeof defaultValue === 'string' ? defaultValue : '#000000'

  const { disabled, path, setValue, showError, value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  })

  const fieldPath = path ?? pathFromProps
  const hex = typeof value === 'string' ? value : ''
  const pickerHex = toPickerHex(hex, fallback)
  const inputId = `field-${fieldPath.replace(/\./g, '__')}`
  const isReadOnly = readOnly || disabled

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue],
  )

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue],
  )

  return (
    <div className={[fieldBaseClass, 'text', 'color-picker-field'].filter(Boolean).join(' ')}>
      <FieldLabel label={label} path={fieldPath} required={required} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={fieldPath} showError={showError} />
        <div
          className={`${fieldBaseClass}__input-row`}
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="color"
            value={pickerHex}
            disabled={isReadOnly}
            onChange={handleColorChange}
            aria-label={typeof label === 'string' ? `${label} picker` : 'Color picker'}
            style={{
              width: '2.75rem',
              height: '2.75rem',
              flexShrink: 0,
              padding: 2,
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-s, 4px)',
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              background: 'var(--theme-input-bg)',
            }}
          />
          <input
            type="text"
            id={inputId}
            name={fieldPath}
            value={hex}
            disabled={isReadOnly}
            onChange={handleTextChange}
            placeholder={fallback}
            style={{ flex: 1, minWidth: '7rem' }}
          />
        </div>
        <FieldDescription description={description} path={fieldPath} />
      </div>
    </div>
  )
}

/** Text field with native color picker and hex input. */
export const ColorPickerField: TextFieldClientComponent = (props) => (
  <ClientOnlyAdminField>
    <ColorPickerFieldContent {...props} />
  </ClientOnlyAdminField>
)
