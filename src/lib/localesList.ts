export interface LocaleOption {
  label: string
  value: string
  isRTL?: boolean
}

// Curated list of common locales with direction metadata.
// Add or remove entries as needed; keep values as BCP-47 primary tags.
export const LOCALES: LocaleOption[] = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Español', value: 'es' },
  { label: 'Português', value: 'pt' },
  { label: '中文 (简体)', value: 'zh' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: 'Русский', value: 'ru' },
  { label: 'العربية', value: 'ar', isRTL: true },
  { label: 'עברית', value: 'he', isRTL: true },
  { label: 'Farsi / فارسی', value: 'fa', isRTL: true },
  { label: 'اردو', value: 'ur', isRTL: true },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'বাংলা', value: 'bn' },
  { label: 'Türkçe', value: 'tr' },
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'Italiano', value: 'it' },
  { label: 'Nederlands', value: 'nl' },
  { label: 'Polski', value: 'pl' },
  { label: 'Svenska', value: 'sv' },
]

export function findLocaleOption(value: string) {
  return LOCALES.find((l) => l.value === value) ?? null
}

export const SELECT_OPTIONS = LOCALES.map((l) => ({ label: l.label, value: l.value })).concat([
  { label: 'Other (custom)', value: 'custom' },
])

export default LOCALES
