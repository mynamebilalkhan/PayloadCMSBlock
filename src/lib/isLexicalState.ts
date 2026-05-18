/** Check if a value is a Lexical SerializedEditorState (no client imports). */
export function isLexicalState(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'root' in value &&
    typeof (value as { root?: unknown }).root === 'object' &&
    (value as { root: { type?: unknown } }).root?.type === 'root'
  )
}
