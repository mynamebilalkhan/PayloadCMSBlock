import type { Payload, PayloadRequest } from 'payload'

/** Returns the enabled locale marked as default, or null. */
export async function getDefaultLocaleId(
  payload: Payload,
  req: PayloadRequest,
): Promise<string | number | null> {
  const result = await payload.find({
    collection: 'locales',
    where: {
      isDefault: { equals: true },
      isEnabled: { equals: true },
    },
    limit: 1,
    req,
    overrideAccess: false,
  })
  const doc = result.docs[0] as { id?: string | number } | undefined
  return doc?.id ?? null
}
