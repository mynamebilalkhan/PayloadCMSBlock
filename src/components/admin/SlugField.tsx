'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  fieldBaseClass,
  useField,
  useFormFields,
} from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { Lock, Unlock } from 'lucide-react'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'
import { formatSlug } from '@/lib/payload/slug'

const SlugFieldContent: TextFieldClientComponent = ({ field, path: pathFromProps, readOnly }) => {
  const {
    admin: { description } = {},
    label,
    required,
  } = field

  const { disabled, path, setValue, showError, value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  })

  const fieldPath = path ?? pathFromProps
  const inputId = `field-${fieldPath.replace(/\./g, '__')}`
  const isReadOnly = readOnly || disabled

  // Watch both title and name in form fields
  const titleValue = useFormFields(([fields]) => fields.title?.value as string | undefined)
  const nameValue = useFormFields(([fields]) => fields.name?.value as string | undefined)

  // Auto-detect target fallback field: use title if present in form, otherwise name
  const fallbackValue = titleValue !== undefined ? titleValue : nameValue
  const allowSlashes = titleValue !== undefined // Pages have title and allow slashes; blocks have name and do not

  // Determine if we start as locked.
  // Locked = true if slug is empty OR if it matches what would be generated from fallbackValue.
  const [isLocked, setIsLocked] = useState(() => {
    if (!value) return true
    if (fallbackValue) {
      const generated = formatSlug(fallbackValue, allowSlashes)
      return value === generated
    }
    return false
  })

  // Sync slug with fallback field when locked
  useEffect(() => {
    if (isLocked && fallbackValue !== undefined && fallbackValue !== null) {
      const generated = formatSlug(fallbackValue, allowSlashes)
      if (value !== generated) {
        setValue(generated)
      }
    }
  }, [fallbackValue, isLocked, setValue, value, allowSlashes])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsLocked(false)
      setValue(e.target.value)
    },
    [setValue],
  )

  const toggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const nextLocked = !prev
      if (nextLocked && fallbackValue) {
        setValue(formatSlug(fallbackValue, allowSlashes))
      }
      return nextLocked
    })
  }, [fallbackValue, setValue, allowSlashes])

  return (
    <div className={[fieldBaseClass, 'text', 'slug-field'].filter(Boolean).join(' ')}>
      <FieldLabel label={label} path={fieldPath} required={required} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={fieldPath} showError={showError} />
        <div
          className={`${fieldBaseClass}__input-row`}
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              id={inputId}
              name={fieldPath}
              value={value ?? ''}
              disabled={isReadOnly}
              onChange={handleInputChange}
              style={{
                width: '100%',
              }}
            />
          </div>
          <button
            type="button"
            disabled={isReadOnly}
            onClick={toggleLock}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 0.85rem',
              height: 'var(--style-input-height, 42px)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-s, 4px)',
              background: isLocked ? 'var(--theme-elevation-100)' : 'var(--theme-input-bg)',
              color: isLocked ? 'var(--theme-elevation-800)' : 'var(--theme-elevation-600)',
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
            title={isLocked ? 'Slug is auto-synced with Title/Name. Click to unlock.' : 'Slug is custom. Click to auto-sync with Title/Name.'}
          >
            {isLocked ? (
              <>
                <Lock size={14} style={{ color: 'var(--color-primary, #4f46e5)' }} />
                <span>Auto</span>
              </>
            ) : (
              <>
                <Unlock size={14} />
                <span>Custom</span>
              </>
            )}
          </button>
        </div>
        <FieldDescription description={description} path={fieldPath} />
      </div>
    </div>
  )
}

export const SlugField: TextFieldClientComponent = (props) => (
  <ClientOnlyAdminField>
    <SlugFieldContent {...props} />
  </ClientOnlyAdminField>
)
export default SlugField
