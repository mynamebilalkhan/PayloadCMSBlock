'use client'

import React from 'react'
import type { BlockComponentProps } from '@/renderer/types'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export interface HomeCtaData {
  heading?: string
  label?: string
  href?: string
}

export function HomeCtaBlock({ data }: BlockComponentProps<HomeCtaData>) {
  const { heading, label, href = '/start-a-conversation' } = data

  return (
    <RevealGroup className="text-center py-32 px-16 border-t border-nb-divider max-[900px]:py-20 max-[900px]:px-8">
      {heading && (
        <h2 className="reveal font-heading text-[clamp(1.5rem,3vw,2.2rem)] font-normal tracking-[0.01em] text-nb-text mb-8">
          {heading}
        </h2>
      )}
      {label && (
        <a
          href={href}
          className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight"
        >
          {label}
        </a>
      )}
    </RevealGroup>
  )
}

export { homeCtaSchema } from '@/blocks/home/schemas'
