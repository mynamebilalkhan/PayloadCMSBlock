'use client'

import React, { useEffect, useRef } from 'react'
import { SelectField, useField, useFormFields } from '@payloadcms/ui'

import { ClientOnlyAdminField } from '@/components/admin/ClientOnlyAdminField'
import { getPresetFormValues } from '@/lib/locale/applyPreset'

type LocalePresetFieldProps = React.ComponentProps<typeof SelectField>

/**
 * Preset select that syncs name, code, and isRTL when a curated locale is chosen.
 */
export function LocalePresetField(props: LocalePresetFieldProps) {
  return (
    <ClientOnlyAdminField>
      <LocalePresetFieldContent {...props} />
    </ClientOnlyAdminField>
  )
}

function LocalePresetFieldContent(props: LocalePresetFieldProps) {
  const preset = useFormFields(([fields]) => fields.preset?.value as string | undefined)
  const { setValue: setIsRTL } = useField<boolean>({ path: 'isRTL' })
  const { setValue: setName } = useField<string>({ path: 'name' })
  const { setValue: setCode } = useField<string>({ path: 'code' })
  const lastSyncedPreset = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!preset || preset === 'custom') {
      lastSyncedPreset.current = preset
      return
    }
    if (preset === lastSyncedPreset.current) return
    lastSyncedPreset.current = preset

    const values = getPresetFormValues(preset)
    if (!values) return

    setIsRTL(values.isRTL)
    setName(values.name)
    setCode(values.code)
  }, [preset, setIsRTL, setName, setCode])

  return <SelectField {...props} />
}
