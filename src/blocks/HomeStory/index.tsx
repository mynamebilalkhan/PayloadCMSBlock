'use client'

import React from 'react'
import type { BlockComponentProps } from '@/renderer/types'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export interface HomeStoryData {
  lead?: string
  leadBold?: string
  paragraphs?: { text?: string; emphasis?: boolean }[]
  closing?: string
}

export function HomeStoryBlock({ data }: BlockComponentProps<HomeStoryData>) {
  const { lead, leadBold, paragraphs = [], closing } = data

  return (
    <RevealGroup className="max-w-[700px] mx-auto px-8 py-32 max-[900px]:py-20">
      {(lead || leadBold) && (
        <p className="reveal font-heading text-[clamp(1.1rem,2vw,1.35rem)] font-normal leading-[1.6] tracking-[0.01em] text-nb-text mb-12">
          {lead}
          {leadBold && (
            <>
              <br />
              <strong className="font-medium">{leadBold}</strong>
            </>
          )}
        </p>
      )}
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={`reveal text-[1.05rem] font-normal leading-[1.9] mb-6 ${
            p.emphasis ? '' : 'text-nb-text-secondary'
          }`}
        >
          {p.emphasis ? (
            <em className="not-italic text-nb-text font-medium">{p.text}</em>
          ) : (
            p.text
          )}
        </p>
      ))}
      {closing && (
        <p className="reveal mt-12 pt-12 border-t border-nb-divider text-[1.1rem] font-light leading-[1.65] text-nb-text">
          {closing}
        </p>
      )}
    </RevealGroup>
  )
}

export { homeStorySchema } from '@/blocks/home/schemas'
