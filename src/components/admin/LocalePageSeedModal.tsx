'use client'

import React from 'react'

import styles from './AdminUI.module.css'

export function LocalePageSeedModal({ open }: { open: boolean }) {
  if (!open) return null

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-busy="true">
      <div className={styles.seedModalPanel}>
        <div className={styles.seedSpinner} aria-hidden="true" />
        <h3 className={styles.seedModalTitle}>Creating pages for the new locale</h3>
        <p className={styles.seedModalText}>
          Copying all pages from the default locale. This may take a moment — please keep this
          tab open.
        </p>
      </div>
    </div>
  )
}
