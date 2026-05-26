import { resolveFontSize } from './fontSize'
import type { ThemeTokens, ThemeTypographyTag } from './tokens'
import { defaultTheme } from './tokens'

type RawThemeGlobal = Record<string, unknown>

const SERIF_FONTS = new Set([
  'Playfair Display', 'Merriweather', 'Lora', 'EB Garamond',
  'Libre Baskerville', 'Crimson Pro', 'Cormorant Garamond',
  'DM Serif Display', 'Fraunces',
])

const MONO_FONTS = new Set([
  'JetBrains Mono', 'Fira Code', 'Source Code Pro',
])

/** Fonts loaded via next/font in layout — keep CSS variable in stack. */
const NEXT_FONT_STACKS: Record<string, string> = {
  'DM Sans': "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
  Michroma:
    "var(--font-michroma), 'Michroma', var(--font-dm-sans), 'DM Sans', sans-serif",
}

function getFontStack(fontName: string): string {
  if (!fontName) return defaultTheme.typography.p.font
  if (NEXT_FONT_STACKS[fontName]) return NEXT_FONT_STACKS[fontName]
  if (MONO_FONTS.has(fontName)) return `'${fontName}', monospace`
  if (SERIF_FONTS.has(fontName)) return `'${fontName}', Georgia, serif`
  return `'${fontName}', system-ui, sans-serif`
}

const SKIP_GOOGLE_FONTS = new Set(['DM Sans', 'Michroma'])

export function buildGoogleFontsURL(t: ThemeTokens): string {
  const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a'] as const
  const fontWeights = new Map<string, Set<string>>()

  for (const tag of tags) {
    const tagTokens = t.typography[tag]
    const rawStack = tagTokens.font
    const firstToken = rawStack.split(',')[0]?.trim().replace(/'/g, '') ?? ''
    if (
      !firstToken ||
      firstToken.startsWith('var(') ||
      firstToken === 'system-ui' ||
      firstToken === 'Georgia' ||
      firstToken === 'monospace' ||
      SKIP_GOOGLE_FONTS.has(firstToken)
    ) {
      continue
    }

    const weight = tagTokens.weight === 'inherit' ? '400' : tagTokens.weight
    if (!fontWeights.has(firstToken)) fontWeights.set(firstToken, new Set())
    fontWeights.get(firstToken)!.add(weight)
  }

  if (fontWeights.size === 0) return ''

  const families: string[] = []
  for (const [family, weights] of fontWeights) {
    const sortedWeights = [...weights].sort((a, b) => Number(a) - Number(b)).join(';')
    families.push(`family=${encodeURIComponent(family)}:wght@${sortedWeights}`)
  }

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

function resolveTag(
  raw: Record<string, unknown>,
  tag: string,
  defaults: ThemeTypographyTag,
): ThemeTypographyTag {
  const group = (raw[tag] as Record<string, unknown>) ?? {}
  const fontName = (group.font as string) || ''
  const resolvedFont = fontName ? getFontStack(fontName) : defaults.font
  return {
    font: resolvedFont,
    size: resolveFontSize(
      group.size as string | undefined,
      group.sizeCustom as string | undefined,
      defaults.size,
    ),
    weight: (group.weight as string) || defaults.weight,
  }
}

function resolveColor(colors: Record<string, unknown>, key: keyof ThemeTokens['colors']): string {
  return (colors[key] as string) || defaultTheme.colors[key]
}

export function resolveTheme(raw: RawThemeGlobal): ThemeTokens {
  const colors = (raw.colors as Record<string, unknown>) ?? {}
  const typo = (raw.typography as Record<string, unknown>) ?? {}
  const spacing = (raw.spacing as Record<string, unknown>) ?? {}
  const buttons = (raw.buttons as Record<string, unknown>) ?? {}
  const shadows = (raw.shadows as Record<string, unknown>) ?? {}
  const layout = (raw.layout as Record<string, unknown>) ?? {}

  return {
    colors: {
      primary: resolveColor(colors, 'primary'),
      secondary: resolveColor(colors, 'secondary'),
      accent: resolveColor(colors, 'accent'),
      background: resolveColor(colors, 'background'),
      surface: resolveColor(colors, 'surface'),
      text: resolveColor(colors, 'text'),
      mutedText: resolveColor(colors, 'mutedText'),
      divider: resolveColor(colors, 'divider'),
      highlight: resolveColor(colors, 'highlight'),
      dark: resolveColor(colors, 'dark'),
      darkText: resolveColor(colors, 'darkText'),
      darkMuted: resolveColor(colors, 'darkMuted'),
      photoBg: resolveColor(colors, 'photoBg'),
    },
    typography: {
      baseFontSize: resolveFontSize(
        typo.baseFontSize as string | undefined,
        typo.baseFontSizeCustom as string | undefined,
        defaultTheme.typography.baseFontSize,
      ),
      lineHeight: (typo.lineHeight as string) || defaultTheme.typography.lineHeight,
      h1: resolveTag(typo, 'h1', defaultTheme.typography.h1),
      h2: resolveTag(typo, 'h2', defaultTheme.typography.h2),
      h3: resolveTag(typo, 'h3', defaultTheme.typography.h3),
      h4: resolveTag(typo, 'h4', defaultTheme.typography.h4),
      h5: resolveTag(typo, 'h5', defaultTheme.typography.h5),
      h6: resolveTag(typo, 'h6', defaultTheme.typography.h6),
      p: resolveTag(typo, 'p', defaultTheme.typography.p),
      a: resolveTag(typo, 'a', defaultTheme.typography.a),
    },
    spacing: {
      sectionGap: (spacing.sectionGap as string) || defaultTheme.spacing.sectionGap,
      containerWidth: (spacing.containerWidth as string) || defaultTheme.spacing.containerWidth,
      radius: (spacing.radius as string) || defaultTheme.spacing.radius,
    },
    buttons: {
      radius: (buttons.radius as string) || defaultTheme.buttons.radius,
      appearance:
        (buttons.appearance as ThemeTokens['buttons']['appearance']) ||
        defaultTheme.buttons.appearance,
      shadow:
        (buttons.shadow as ThemeTokens['buttons']['shadow']) || defaultTheme.buttons.shadow,
    },
    shadows: {
      card: (shadows.card as ThemeTokens['shadows']['card']) || defaultTheme.shadows.card,
      overlay:
        (shadows.overlay as ThemeTokens['shadows']['overlay']) || defaultTheme.shadows.overlay,
    },
    layout: {
      sidePadding: (layout.sidePadding as string) || defaultTheme.layout.sidePadding,
      proseWidth: (layout.proseWidth as string) || defaultTheme.layout.proseWidth,
    },
  }
}

const SHADOW_VALUES: Record<string, string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)',
  xl: '0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)',
}

/**
 * Injected in [locale]/layout. Drives Tailwind `nb-*` utilities and legacy CSS vars.
 */
export function tokensToCSS(t: ThemeTokens): string {
  const { colors: c, typography: ty } = t

  return `:root {
  /* ── Semantic colors ─────────────────────────────────────────────── */
  --color-primary: ${c.primary};
  --color-secondary: ${c.secondary};
  --color-accent: ${c.accent};
  --color-background: ${c.background};
  --color-surface: ${c.surface};
  --color-text: ${c.text};
  --color-muted-text: ${c.mutedText};
  --color-divider: ${c.divider};
  --color-highlight: ${c.highlight};
  --color-dark: ${c.dark};
  --color-dark-text: ${c.darkText};
  --color-dark-muted: ${c.darkMuted};
  --color-photo-bg: ${c.photoBg};

  /* ── Site palette (Tailwind nb-* / nextbridge.css) ───────────────── */
  --color-nb-bg: ${c.background};
  --color-nb-text: ${c.text};
  --color-nb-text-secondary: ${c.mutedText};
  --color-nb-divider: ${c.divider};
  --color-nb-highlight: ${c.highlight};
  --color-nb-dark: ${c.dark};
  --color-nb-dark-text: ${c.darkText};
  --color-nb-dark-muted: ${c.darkMuted};
  --color-nb-photo-bg: ${c.photoBg};

  /* ── Legacy aliases (nextbridge.css) ─────────────────────────────── */
  --color-bg: ${c.background};
  --color-text: ${c.text};
  --color-text-secondary: ${c.mutedText};
  --color-divider: ${c.divider};
  --color-highlight: ${c.highlight};
  --color-dark: ${c.dark};
  --color-dark-text: ${c.darkText};
  --color-dark-muted: ${c.darkMuted};
  --color-photo-bg: ${c.photoBg};
  --font: ${ty.p.font};
  --font-heading: ${ty.h1.font};

  /* ── Typography ──────────────────────────────────────────────────── */
  --font-size-base: ${ty.baseFontSize};
  --line-height: ${ty.lineHeight};
  --font-family-sans: ${ty.p.font};
  --font-family-heading: ${ty.h1.font};

  --font-h1: ${ty.h1.font}; --font-size-h1: ${ty.h1.size}; --font-weight-h1: ${ty.h1.weight};
  --font-h2: ${ty.h2.font}; --font-size-h2: ${ty.h2.size}; --font-weight-h2: ${ty.h2.weight};
  --font-h3: ${ty.h3.font}; --font-size-h3: ${ty.h3.size}; --font-weight-h3: ${ty.h3.weight};
  --font-h4: ${ty.h4.font}; --font-size-h4: ${ty.h4.size}; --font-weight-h4: ${ty.h4.weight};
  --font-h5: ${ty.h5.font}; --font-size-h5: ${ty.h5.size}; --font-weight-h5: ${ty.h5.weight};
  --font-h6: ${ty.h6.font}; --font-size-h6: ${ty.h6.size}; --font-weight-h6: ${ty.h6.weight};
  --font-p: ${ty.p.font}; --font-size-p: ${ty.p.size}; --font-weight-p: ${ty.p.weight};
  --font-a: ${ty.a.font}; --font-size-a: ${ty.a.size}; --font-weight-a: ${ty.a.weight};

  /* ── Spacing & layout ────────────────────────────────────────────── */
  --spacing-section: ${t.spacing.sectionGap};
  --container-width: ${t.spacing.containerWidth};
  --radius-border: ${t.spacing.radius};
  --section-padding-x: ${t.layout.sidePadding};
  --prose-width: ${t.layout.proseWidth};

  /* ── Buttons ─────────────────────────────────────────────────────── */
  --radius-button: ${t.buttons.radius};
  --button-appearance: ${t.buttons.appearance};
  --shadow-button: ${SHADOW_VALUES[t.buttons.shadow] ?? 'none'};

  /* ── Shadows ─────────────────────────────────────────────────────── */
  --shadow-card: ${SHADOW_VALUES[t.shadows.card] ?? SHADOW_VALUES.sm};
  --shadow-overlay: ${SHADOW_VALUES[t.shadows.overlay] ?? SHADOW_VALUES.xl};
}`
}
