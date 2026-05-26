'use client'

import React, { useEffect, useState } from 'react'

import { SchemaPreviewWireframe } from '@/components/admin/SchemaPreviewWireframe'
import { extractBlockSchema, isBlockSchema } from '@/lib/admin/schemaPreviewFields'
import { getUploadedBlockPreviewUrl, resolveBlockPreviewVariant } from '@/lib/admin/blockDefinitionPreview'
import type { BlockSchema } from '@/validation/types'

export type BlockPreviewBlock = {
  name: string
  slug?: string
  category?: string | null
  icon?: string | null
  thumbnail?: { url?: string } | null
  previewImage?: { url?: string } | null
  currentVersion?: { id?: string | number; schema?: unknown } | null
}

type BlockPreviewImageProps = {
  block: BlockPreviewBlock
  /** Explicit schema overrides currentVersion.schema (e.g. while loading). */
  schema?: BlockSchema | null
  height?: number | string
  width?: number | string
  selected?: boolean
  style?: React.CSSProperties
}

function BlockPreviewIcon({ icon, name }: { icon?: string | null; name: string }) {
  if (icon && icon.length <= 2) {
    return <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>{icon}</span>
  }
  return (
    <span
      style={{
        fontSize: '0.625rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: 'rgba(67, 56, 202, 0.85)',
        textTransform: 'uppercase',
      }}
    >
      {name.slice(0, 2)}
    </span>
  )
}

function GenericCategoryWireframe({
  block,
  selected,
}: {
  block: BlockPreviewBlock
  selected?: boolean
}) {
  const variant = resolveBlockPreviewVariant({
    slug: block.slug,
    category: block.category,
  })

  const bar = (w: string | number, h: number, opacity = 0.35): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 2,
    background: `rgba(15, 23, 42, ${opacity})`,
  })

  return (
    <div style={{ padding: '8px 10px', height: '100%', boxSizing: 'border-box' }}>
      {variant === 'media' ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 4,
            background: 'rgba(15, 23, 42, 0.12)',
          }}
        />
      ) : (
        <>
          <div style={bar('70%', 4, 0.35)} />
          <div style={{ ...bar('50%', 3, 0.2), marginTop: 4 }} />
        </>
      )}
    </div>
  )
}

export function BlockPreviewImage({
  block,
  schema: schemaProp,
  height = 80,
  width = '100%',
  selected,
  style,
}: BlockPreviewImageProps) {
  const uploaded = getUploadedBlockPreviewUrl(block)
  const [loadedSchema, setLoadedSchema] = useState<BlockSchema | null>(null)

  const versionId = block.currentVersion?.id

  useEffect(() => {
    const fromDoc = extractBlockSchema({ schema: schemaProp, currentVersion: block.currentVersion })
    if (fromDoc) {
      setLoadedSchema(fromDoc)
      return
    }
    if (!versionId) {
      setLoadedSchema(null)
      return
    }

    let cancelled = false
    fetch(`/api/block-definition-versions/${versionId}?depth=0`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc: { schema?: unknown } | null) => {
        if (!cancelled && doc && isBlockSchema(doc.schema)) {
          setLoadedSchema(doc.schema)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedSchema(null)
      })

    return () => {
      cancelled = true
    }
  }, [schemaProp, block.currentVersion, versionId])

  if (uploaded) {
    return (
      <img
        src={uploaded}
        alt={block.name}
        style={{
          width,
          height,
          objectFit: 'contain',
          borderRadius: '0.375rem',
          display: 'block',
          background: '#f3f4f6',
          ...style,
        }}
      />
    )
  }

  const schema =
    extractBlockSchema({ schema: schemaProp, currentVersion: block.currentVersion }) ?? loadedSchema

  return (
    <div
      aria-hidden
      title={
        schema
          ? `Form preview for ${block.name}`
          : `Auto preview for ${block.name}`
      }
      style={{
        width,
        height,
        borderRadius: '0.375rem',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        boxSizing: 'border-box',
        position: 'relative',
        ...style,
      }}
    >
      {schema ? (
        <SchemaPreviewWireframe schema={schema} selected={selected} />
      ) : (
        <div
          style={{
            height: '100%',
            background: selected
              ? 'linear-gradient(145deg, #e0e7ff 0%, #ede9fe 55%, #fae8ff 100%)'
              : 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%)',
          }}
        >
          <GenericCategoryWireframe block={block} selected={selected} />
        </div>
      )}
      {/* <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <BlockPreviewIcon icon={block.icon} name={block.name} />
      </div> */}
    </div>
  )
}
