'use client'

import React from 'react'
import styles from './AdminUI.module.css'

type ButtonTone = 'default' | 'primary' | 'bare' | 'danger'

export function AdminButton({
  children,
  tone = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone
}) {
  const toneClass =
    tone === 'primary'
      ? styles.buttonPrimary
      : tone === 'bare'
        ? styles.buttonBare
        : tone === 'danger'
          ? styles.buttonDanger
          : ''

  return (
    <button className={[styles.button, toneClass, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  )
}

export function AdminModal({
  title,
  description,
  children,
  footer,
  onClose,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          {description && <p className={styles.fieldDescription}>{description}</p>}
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  )
}

export function AdminBadge({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'success' | 'warning' | 'muted'
}) {
  const toneClass =
    tone === 'success'
      ? styles.badgeSuccess
      : tone === 'warning'
        ? styles.badgeWarning
        : styles.badgeMuted

  return <span className={[styles.badge, toneClass].join(' ')}>{children}</span>
}

export { styles as adminUIStyles }
