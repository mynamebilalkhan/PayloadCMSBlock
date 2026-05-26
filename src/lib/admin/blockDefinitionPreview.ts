export type BlockPreviewSource = {
  slug?: string
  category?: string | null
  icon?: string | null
}

export type BlockPreviewVariant =
  | 'hero'
  | 'content'
  | 'media'
  | 'navigation'
  | 'grid'
  | 'faq'
  | 'cta'
  | 'pricing'
  | 'testimonials'
  | 'utility'

export function getUploadedBlockPreviewUrl(source: {
  thumbnail?: { url?: string } | null
  previewImage?: { url?: string } | null
}): string | undefined {
  return source.thumbnail?.url ?? source.previewImage?.url ?? undefined
}

/** Picks a wireframe layout when no custom thumbnail is uploaded. */
export function resolveBlockPreviewVariant(source: BlockPreviewSource): BlockPreviewVariant {
  const slug = (source.slug ?? '').toLowerCase()

  if (/(hero|banner|home-banner)/.test(slug)) return 'hero'
  if (/(faq)/.test(slug)) return 'faq'
  if (/(testimonial|voices|review)/.test(slug)) return 'testimonials'
  if (/(pricing|plan)/.test(slug)) return 'pricing'
  if (/(cta|call-to-action)/.test(slug)) return 'cta'
  if (/(video)/.test(slug)) return 'media'
  if (/(grid|doors|features|cards)/.test(slug)) return 'grid'
  if (/(nav|menu|header|footer)/.test(slug)) return 'navigation'

  switch (source.category) {
    case 'layout':
      return 'hero'
    case 'media':
      return 'media'
    case 'navigation':
      return 'navigation'
    case 'data-display':
      return 'grid'
    case 'interactive':
      return 'cta'
    case 'utility':
      return 'utility'
    case 'content':
    default:
      return 'content'
  }
}
