import { buildEditorState } from '@payloadcms/richtext-lexical/client'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { isLexicalState as isLexicalStateCheck } from '@/lib/isLexicalState'

/** Payload Lexical editor profile used by dynamic block richtext fields. */
export const DYNAMIC_BLOCK_RICHTEXT_SCHEMA_PATH =
  'collection.block-definition-versions._dynamicBlockRichText'

export function isLexicalState(value: unknown): value is DefaultTypedEditorState {
  return isLexicalStateCheck(value)
}

function stripHtmlToText(html: string): string {
  if (typeof document !== 'undefined') {
    const el = document.createElement('div')
    el.innerHTML = html
    return el.textContent?.trim() ?? ''
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Normalize admin / stored values into Lexical editor state. */
export async function normalizeRichTextValue(
  value: unknown,
): Promise<DefaultTypedEditorState> {
  if (isLexicalState(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    return buildEditorState({ text: stripHtmlToText(value) })
  }

  return buildEditorState({ text: '' })
}

export function emptyLexicalState(): DefaultTypedEditorState {
  return buildEditorState({ text: '' })
}
