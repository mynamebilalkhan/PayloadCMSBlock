'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { isLexicalState } from '@/lib/richText'

type Props = {
  value: unknown
  className?: string
}

/** Renders dynamic block richtext values (Lexical JSON or legacy HTML). */
export function RichTextContent({ value, className }: Props) {
  if (value === null || value === undefined || value === '') return null

  if (isLexicalState(value)) {
    return (
      <RichText
        data={value as DefaultTypedEditorState}
        className={className}
      />
    )
  }

  if (typeof value === 'string') {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  return null
}
