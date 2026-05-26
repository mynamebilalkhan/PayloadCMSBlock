// ─── Theme token interfaces ────────────────────────────────────────────────────
// These are the resolved, fully-typed tokens that components reference.
// Raw Payload global data is converted to this shape by resolver.ts.

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  mutedText: string
  divider: string
  highlight: string
  dark: string
  darkText: string
  darkMuted: string
  photoBg: string
}

export interface ThemeTypographyTag {
  font: string
  size: string
  weight: string
}

export interface ThemeTypography {
  baseFontSize: string
  lineHeight: string
  h1: ThemeTypographyTag
  h2: ThemeTypographyTag
  h3: ThemeTypographyTag
  h4: ThemeTypographyTag
  h5: ThemeTypographyTag
  h6: ThemeTypographyTag
  p: ThemeTypographyTag
  a: ThemeTypographyTag
}

export interface ThemeSpacing {
  sectionGap: string
  containerWidth: string
  radius: string
}

export interface ThemeButtons {
  radius: string
  appearance: 'solid' | 'outline' | 'ghost' | 'soft'
  shadow: 'none' | 'sm' | 'md'
}

export interface ThemeShadows {
  card: 'none' | 'sm' | 'md' | 'lg'
  overlay: 'md' | 'lg' | 'xl'
}

export interface ThemeLayout {
  sidePadding: string
  proseWidth: string
}

export interface ThemeTokens {
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  buttons: ThemeButtons
  shadows: ThemeShadows
  layout: ThemeLayout
}

// ─── Default (NEXTBRIDGE site baseline) ───────────────────────────────────────

const BODY_FONT = "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif"
const HEADING_FONT =
  "var(--font-michroma), 'Michroma', var(--font-dm-sans), 'DM Sans', sans-serif"

const defaultTag = (font: string, size: string, weight: string): ThemeTypographyTag => ({
  font,
  size,
  weight,
})

export const defaultTheme: ThemeTokens = {
  colors: {
    primary: '#1a1a18',
    secondary: '#c8a96e',
    accent: '#c8a96e',
    background: '#fafaf8',
    surface: '#f9fafb',
    text: '#1a1a18',
    mutedText: '#6b6b63',
    divider: '#e0ded8',
    highlight: '#c8a96e',
    dark: '#1a1a18',
    darkText: '#fafaf8',
    darkMuted: '#a8a89e',
    photoBg: '#e8e6e0',
  },
  typography: {
    baseFontSize: '16px',
    lineHeight: '1.6',
    h1: defaultTag(HEADING_FONT, '3.5rem', '400'),
    h2: defaultTag(HEADING_FONT, '2.25rem', '400'),
    h3: defaultTag(HEADING_FONT, '1.75rem', '400'),
    h4: defaultTag(HEADING_FONT, '1.375rem', '400'),
    h5: defaultTag(HEADING_FONT, '1.125rem', '400'),
    h6: defaultTag(HEADING_FONT, '1rem', '400'),
    p: defaultTag(BODY_FONT, '1rem', '400'),
    a: defaultTag(BODY_FONT, 'inherit', '500'),
  },
  spacing: {
    sectionGap: '96px',
    containerWidth: '1200px',
    radius: '0px',
  },
  buttons: {
    radius: '0px',
    appearance: 'solid',
    shadow: 'none',
  },
  shadows: {
    card: 'none',
    overlay: 'lg',
  },
  layout: {
    sidePadding: '64px',
    proseWidth: '800px',
  },
}
