'use client'

import React from 'react'
import type { BlockComponentProps } from '@/renderer/types'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export interface HomeDoorItem {
  title?: string
  body?: string
  link?: string
  href?: string
}

export interface HomeDoorsData {
  items?: HomeDoorItem[]
}

export function HomeDoorsBlock({ data }: BlockComponentProps<HomeDoorsData>) {
  const items = data.items ?? []

  return (
    <section className="bg-nb-dark py-24 px-16 max-[900px]:py-16 max-[900px]:px-8">
      <RevealGroup className="max-w-[1100px] mx-auto grid grid-cols-3 gap-6 max-[900px]:grid-cols-1">
        {items.map((door, i) => (
          <a
            key={i}
            href={door.href ?? '#'}
            className="reveal group flex flex-col p-11 border border-white/[0.07] no-underline transition-all duration-300 hover:border-nb-highlight hover:-translate-y-[3px]"
          >
            <h3 className="font-heading text-[1rem] font-normal tracking-[0.01em] text-nb-dark-text mb-3">
              {door.title}
            </h3>
            <p className="text-[0.92rem] font-normal leading-[1.7] text-nb-dark-muted mb-auto pb-6">
              {door.body}
            </p>
            <div className="flex items-center gap-2 text-[0.75rem] font-medium tracking-[0.15em] uppercase text-nb-highlight transition-[gap] duration-200 group-hover:gap-[0.85rem]">
              {door.link}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </a>
        ))}
      </RevealGroup>
    </section>
  )
}

export { homeDoorsSchema } from '@/blocks/home/schemas'
