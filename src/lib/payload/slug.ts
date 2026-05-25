/**
 * Central slug utility for formatting, sanitizing, and auto-generating slugs.
 */

/**
 * Format a raw string into a clean, URL-safe slug.
 *
 * @param val - The raw text to slugify.
 * @param allowSlashes - Whether to preserve slashes for nested routing.
 */
export function formatSlug(val: string, allowSlashes: boolean = true): string {
  let cleaned = val
    .toLowerCase()
    .trim()

  if (allowSlashes) {
    cleaned = cleaned
      .replace(/[^a-z0-9/-]+/g, '-') // Replace invalid characters with a single dash (keep slashes)
      .replace(/\/+/g, '/')          // Collapse duplicate slashes

    cleaned = cleaned.replace(/^-+|-+$/g, '') // Strip leading/trailing dashes

    // Strip trailing slash unless the entire string is just "/"
    if (cleaned.length > 1 && cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1)
    }
    // Strip leading slash unless the entire string is just "/"
    if (cleaned.length > 1 && cleaned.startsWith('/')) {
      cleaned = cleaned.slice(1)
    }

    return cleaned || '/'
  } else {
    // For block definitions (no slashes allowed)
    cleaned = cleaned
      .replace(/[^a-z0-9]+/g, '-') // Replace all non-alphanumeric with a dash
      .replace(/^-+|-+$/g, '')     // Strip leading/trailing dashes
    
    return cleaned
  }
}

/**
 * Returns a collection-level beforeValidate hook to auto-populate and normalize slugs.
 *
 * @param fallbackField - The field to generate the slug from (e.g. 'title' or 'name')
 * @param allowSlashes - Whether to allow nested routes in the slug
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function slugBeforeValidate(fallbackField: string, allowSlashes: boolean = true): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ data }: { data?: any }) => {
    if (data) {
      if ((data.slug === undefined || data.slug === null || String(data.slug).trim() === '') && data[fallbackField]) {
        data.slug = data[fallbackField]
      }
      if (data.slug) {
        data.slug = formatSlug(String(data.slug), allowSlashes)
      }
    }
    return data
  }
}
