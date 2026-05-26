'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FormSubmit,
  useDocumentInfo,
  useEditDepth,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useHotkey,
  useOperation,
  useTranslation,
} from '@payloadcms/ui'
import type { SaveButtonClientProps } from 'payload'

import { LocalePageSeedModal } from '@/components/admin/LocalePageSeedModal'
import { shouldSeedPages } from '@/lib/admin/localeSeedPages'

export function LocaleSaveButton({ label: labelProp }: SaveButtonClientProps) {
  const { uploadStatus, initialData } = useDocumentInfo()
  const { t } = useTranslation()
  const { submit } = useForm()
  const modified = useFormModified()
  const processing = useFormProcessing()
  const operation = useOperation()
  const editDepth = useEditDepth()
  const ref = useRef<HTMLButtonElement>(null)

  const [showSeedModal, setShowSeedModal] = useState(false)
  const seedingRef = useRef(false)

  const duplicatePagesFromDefault = useFormFields(
    ([fields]) => fields.duplicatePagesFromDefault?.value as boolean | undefined,
  )
  const isDefault = useFormFields(([fields]) => fields.isDefault?.value as boolean | undefined)
  const isEnabled = useFormFields(([fields]) => fields.isEnabled?.value as boolean | undefined)

  const willSeedPages = useMemo(() => {
    const doc = { duplicatePagesFromDefault, isDefault, isEnabled }
    const previousDoc =
      operation === 'update' && initialData
        ? { isEnabled: (initialData as { isEnabled?: boolean }).isEnabled }
        : undefined

    return shouldSeedPages({
      operation: operation === 'update' ? 'update' : 'create',
      doc,
      previousDoc,
    })
  }, [
    duplicatePagesFromDefault,
    isDefault,
    isEnabled,
    operation,
    initialData,
  ])

  const label = labelProp || t('general:save')
  const disabled =
    (operation === 'update' && !modified) || uploadStatus === 'uploading'

  useHotkey(
    {
      cmdCtrlKey: true,
      editDepth,
      keyCodes: ['s'],
    },
    (e) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      ref.current?.click()
    },
  )

  const handleSubmit = useCallback(() => {
    if (uploadStatus === 'uploading') return
    if (willSeedPages) {
      seedingRef.current = true
      setShowSeedModal(true)
    }
    void submit()
  }, [submit, uploadStatus, willSeedPages])

  useEffect(() => {
    if (!showSeedModal || !seedingRef.current) return
    if (processing) return

    const timer = window.setTimeout(() => {
      seedingRef.current = false
      setShowSeedModal(false)
    }, 600)

    return () => window.clearTimeout(timer)
  }, [processing, showSeedModal])

  return (
    <>
      <FormSubmit
        buttonId="action-save"
        disabled={disabled}
        onClick={handleSubmit}
        ref={ref}
        size="medium"
        type="button"
      >
        {label}
      </FormSubmit>
      <LocalePageSeedModal open={showSeedModal} />
    </>
  )
}
