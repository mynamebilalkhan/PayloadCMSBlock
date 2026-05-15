'use client'

import React, { useEffect, useState } from 'react'

/**
 * Defers children until after mount so custom admin UI fields do not participate in SSR.
 * This keeps React's useId() sequence stable for Payload's DraggableSortable (dbLayout array).
 */
export function ClientOnlyAdminField({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      fallback ?? (
        <div className="field-type ui" aria-hidden="true" style={{ minHeight: 1 }} />
      )
    )
  }

  return <>{children}</>
}
