'use client'

import React, { useEffect, useRef } from 'react'

interface RevealWrapperProps {
  children: React.ReactNode
  className?: string
  as?: keyof React.JSX.IntrinsicElements
  delay?: number
}

export function RevealWrapper({ children, className = '', as: Tag = 'div', delay = 0 }: RevealWrapperProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  )
}

// Batch reveal — observes all .reveal children with staggered delay
export function RevealGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const items = Array.from(container.querySelectorAll<HTMLElement>('.reveal'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => (entry.target as HTMLElement).classList.add('visible'), i * 80)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    items.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
