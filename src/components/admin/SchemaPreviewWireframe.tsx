'use client'

import React from 'react'

import {
  pickTopLevelPreviewFields,
  PREVIEW_MAX_ARRAY_ROWS,
  PREVIEW_MAX_GROUP_CHILDREN,
  sortFieldsForPreview,
  fieldWidthPercent,
} from '@/lib/admin/schemaPreviewFields'
import type { BlockField, BlockSchema } from '@/validation/types'

type SchemaPreviewWireframeProps = {
  schema: BlockSchema
  selected?: boolean
}

const bar = (w: string | number, h: number, opacity = 0.32): React.CSSProperties => ({
  width: w,
  height: h,
  borderRadius: 2,
  background: `rgba(15, 23, 42, ${opacity})`,
})

const labelStyle: React.CSSProperties = {
  fontSize: '0.5rem',
  lineHeight: 1.1,
  fontWeight: 600,
  color: 'rgba(51, 65, 85, 0.75)',
  marginBottom: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

function fieldLabel(field: BlockField): string {
  return field.label ?? field.name
}

function LeafControl({ field }: { field: BlockField }) {
  switch (field.type) {
    case 'textarea':
    case 'richtext':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={bar('100%', 3, 0.28)} />
          <div style={bar('92%', 3, 0.22)} />
          <div style={bar('75%', 3, 0.16)} />
        </div>
      )
    case 'image':
    case 'file':
      return (
        <div
          style={{
            width: '100%',
            height: 18,
            borderRadius: 3,
            border: '1px dashed rgba(15, 23, 42, 0.2)',
            background: 'rgba(15, 23, 42, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '6px solid rgba(15, 23, 42, 0.25)',
            }}
          />
        </div>
      )
    case 'checkbox':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              border: '1.5px solid rgba(15, 23, 42, 0.35)',
              background: 'rgba(255,255,255,0.6)',
            }}
          />
          <div style={bar('70%', 3, 0.2)} />
        </div>
      )
    case 'color':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: '1px solid rgba(15, 23, 42, 0.15)',
            }}
          />
          <div style={bar('55%', 3, 0.2)} />
        </div>
      )
    case 'select':
    case 'multiselect':
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
            padding: '2px 4px',
            borderRadius: 3,
            border: '1px solid rgba(15, 23, 42, 0.15)',
            background: 'rgba(255,255,255,0.55)',
          }}
        >
          <div style={bar('65%', 3, 0.28)} />
          <span style={{ fontSize: '0.45rem', opacity: 0.45 }}>▾</span>
        </div>
      )
    case 'number':
    case 'date':
      return <div style={bar('55%', 4, 0.3)} />
    case 'blocks':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                padding: 3,
                borderRadius: 3,
                border: '1px solid rgba(99, 102, 241, 0.25)',
                background: 'rgba(99, 102, 241, 0.08)',
              }}
            >
              <div style={bar('50%', 2, 0.35)} />
            </div>
          ))}
        </div>
      )
    case 'array': {
      const rowFields = sortFieldsForPreview(field.fields).slice(0, 3)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: PREVIEW_MAX_ARRAY_ROWS }).map((_, row) => (
            <div
              key={row}
              style={{
                padding: 3,
                borderRadius: 3,
                background: 'rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              {rowFields.length > 0
                ? rowFields.map((child) => (
                    <div key={child.name} style={{ flex: '1 1 40%', minWidth: 0 }}>
                      <LeafControl field={child} />
                    </div>
                  ))
                : <div style={bar('100%', 3, 0.2)} />}
            </div>
          ))}
        </div>
      )
    }
    case 'group':
      return null
    case 'relationship':
    case 'json':
    case 'text':
    case 'url':
    case 'email':
    default:
      return <div style={bar('85%', 4, field.type === 'text' ? 0.34 : 0.28)} />
  }
}

function PreviewFieldNode({ field, depth }: { field: BlockField; depth: number }) {
  const width = fieldWidthPercent(field.ui?.width)

  if (field.type === 'group' && depth < 1) {
    const children = sortFieldsForPreview(field.fields).slice(0, PREVIEW_MAX_GROUP_CHILDREN)
    return (
      <div
        style={{
          width,
          minWidth: 0,
          padding: 4,
          borderRadius: 4,
          border: '1px dashed rgba(99, 102, 241, 0.35)',
          background: 'rgba(255,255,255,0.35)',
          boxSizing: 'border-box',
        }}
      >
        <div style={labelStyle}>{fieldLabel(field)}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {children.map((child) => (
            <PreviewFieldNode key={child.name} field={child} depth={depth + 1} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ width, minWidth: 0, boxSizing: 'border-box' }}>
      <div style={labelStyle}>{fieldLabel(field)}</div>
      <LeafControl field={field} />
    </div>
  )
}

export function SchemaPreviewWireframe({ schema, selected }: SchemaPreviewWireframeProps) {
  const fields = pickTopLevelPreviewFields(schema)

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: 4,
        padding: '6px 8px',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: selected
          ? 'linear-gradient(145deg, #e0e7ff 0%, #ede9fe 55%, #fae8ff 100%)'
          : 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%)',
      }}
    >
      {fields.length === 0 ? (
        <div style={{ ...bar('80%', 4, 0.2), margin: 'auto' }} />
      ) : (
        fields.map((field) => (
          <PreviewFieldNode key={field.name} field={field} depth={0} />
        ))
      )}
    </div>
  )
}
