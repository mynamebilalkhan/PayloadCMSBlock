'use client'

import React from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

export function EditInBuilderButton() {
  const { id, savedDocumentData } = useDocumentInfo()
  const { value: slug } = useField<string>({ path: 'slug' })

  // Only render on saved documents that have a slug
  if (!id || !slug) return null

  const builderUrl = `/block-builder?load=${encodeURIComponent(slug)}`

  return (
    <div
      style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--theme-elevation-150)',
      }}
    >
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--theme-text)',
          marginBottom: '0.5rem',
          opacity: 0.7,
        }}
      >
        Want to modify this block&apos;s schema? Open it in the visual builder, make your changes, then
        click &ldquo;Publish to Payload&rdquo; to create a new version.
      </p>
      <a
        href={builderUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 1rem',
          background: 'var(--theme-success-500)',
          color: '#fff',
          borderRadius: '0.25rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.85')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
      >
        ✏️ Edit in Block Builder
        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
          → creates new version
        </span>
      </a>
    </div>
  )
}
