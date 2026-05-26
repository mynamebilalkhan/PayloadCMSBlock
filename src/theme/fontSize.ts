/** Select value that reveals the custom size text field in Global Styles. */
export const CUSTOM_FONT_SIZE = '__custom__'

const CSS_LENGTH =
  /^(\d+(\.\d+)?(px|rem|em|%|vw|vh|ch|ex)|inherit|clamp\([^)]+\)|min\([^)]+\)|max\([^)]+\))$/i

export function withCustomSizeOption(
  options: { label: string; value: string }[],
): { label: string; value: string }[] {
  return [...options, { label: 'Custom…', value: CUSTOM_FONT_SIZE }]
}

export function resolveFontSize(
  preset: string | undefined,
  custom: string | undefined,
  fallback: string,
): string {
  if (preset === CUSTOM_FONT_SIZE) {
    const trimmed = custom?.trim()
    return trimmed || fallback
  }
  return preset?.trim() || fallback
}

export function isValidCssFontSize(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  return CSS_LENGTH.test(v)
}
