import { findLocaleOption } from '@/lib/localesList'

export interface PresetFormValues {
  name: string
  code: string
  isRTL: boolean
}

/** Returns derived field values for a preset code, or null for custom / unknown. */
export function getPresetFormValues(preset: string): PresetFormValues | null {
  if (!preset || preset === 'custom') return null
  const option = findLocaleOption(preset)
  if (!option) return null
  return {
    name: option.label,
    code: option.value,
    isRTL: Boolean(option.isRTL),
  }
}

/** Applies preset name, code, and isRTL onto a document data object (server hooks). */
export function applyPresetToData(data: Record<string, unknown>): void {
  const preset = data.preset
  if (!preset || preset === 'custom') return
  const values = getPresetFormValues(String(preset))
  if (!values) return
  data.name = values.name
  data.code = values.code
  data.isRTL = values.isRTL
}
