'use client'

import { isDocumentEvent, ready } from '@payloadcms/live-preview'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const PREVIEW_REFRESH_DEBOUNCE_MS = 1200

type Props = {
  serverURL: string
}

/**
 * Debounced live-preview refresh — Payload fires a document event on every autosave;
 * refreshing immediately on each event recompiles the full frontend route and can
 * block the admin save flow (POST /api/pages/access returns HTML 500 while compiling).
 */
export function LivePreviewListener({ serverURL }: Props) {
  const router = useRouter()
  const hasSentReadyMessage = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      router.refresh()
    }, PREVIEW_REFRESH_DEBOUNCE_MS)
  }, [router])

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (isDocumentEvent(event, serverURL)) {
        scheduleRefresh()
      }
    },
    [scheduleRefresh, serverURL],
  )

  useEffect(() => {
    window.addEventListener('message', onMessage)

    if (!hasSentReadyMessage.current) {
      hasSentReadyMessage.current = true
      ready({ serverURL })
      scheduleRefresh()
    }

    return () => {
      window.removeEventListener('message', onMessage)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [onMessage, scheduleRefresh, serverURL])

  return null
}
