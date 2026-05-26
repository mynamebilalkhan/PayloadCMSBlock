export type LocaleSeedForm = {
  duplicatePagesFromDefault?: boolean | null
  isDefault?: boolean | null
  isEnabled?: boolean | null
}

/** Whether saving should copy all default-locale pages (server + admin UI). */
export function shouldSeedPages({
  operation,
  doc,
  previousDoc,
}: {
  operation: 'create' | 'update'
  doc: LocaleSeedForm
  previousDoc?: LocaleSeedForm | null
}): boolean {
  if (doc.duplicatePagesFromDefault === false) return false
  if (doc.isDefault === true) return false
  if (doc.isEnabled === false) return false

  if (operation === 'create') return true

  return (
    operation === 'update' &&
    previousDoc?.isEnabled === false &&
    doc.isEnabled === true
  )
}
