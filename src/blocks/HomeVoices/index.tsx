'use client'

import React from 'react'
import type { BlockComponentProps } from '@/renderer/types'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export interface HomeVoiceItem {
  quote?: string
  name?: string
  company?: string
}

export interface HomeVoicesData {
  heading?: string
  items?: HomeVoiceItem[]
}

export function HomeVoicesBlock({ data }: BlockComponentProps<HomeVoicesData>) {
  const { heading, items = [] } = data

  return (
    <RevealGroup className="max-w-[1100px] mx-auto px-16 py-32 max-[900px]:px-8 max-[900px]:py-20">
      {heading && (
        <div className="reveal text-[0.7rem] font-medium tracking-[0.2em] uppercase text-nb-text-secondary mb-14">
          {heading}
        </div>
      )}
      <div className="grid grid-cols-3 gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        {items.map((v, i) => (
          <VoiceItem key={i} quote={v.quote} name={v.name} company={v.company} />
        ))}
      </div>
    </RevealGroup>
  )
}

function VoiceItem({ quote, name, company }: HomeVoiceItem) {
  return (
    <div className="reveal pl-6 border-l-2 border-nb-divider transition-colors duration-300 hover:border-l-nb-highlight">
      <blockquote className="text-[1.05rem] font-normal leading-[1.65] text-nb-text mb-5 tracking-[-0.005em] not-italic">
        {quote}
      </blockquote>
      <cite className="not-italic text-[0.82rem] font-normal text-nb-text-secondary block leading-[1.5]">
        <strong className="font-medium text-nb-text block">{name}</strong>
        {company}
      </cite>
    </div>
  )
}

export { homeVoicesSchema } from '@/blocks/home/schemas'
