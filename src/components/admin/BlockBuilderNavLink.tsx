'use client'

import React from 'react'
import Link from 'next/link'

export function BlockBuilderNavLink() {
  return (
    <div style={{ padding: '0 16px 8px' }}>
      <Link
        href="/block-builder"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--theme-success-500)',
          textDecoration: 'none',
          border: '1px solid var(--theme-success-500)',
          background: 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background =
            'var(--theme-elevation-150)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
        }}
      >
        <span>＋</span>
        <span>Create New Block</span>
      </Link>
    </div>
  )
}
