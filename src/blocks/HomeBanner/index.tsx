import React from 'react'
import type { BlockComponentProps } from '@/renderer/types'

export interface HomeBannerData {
  title?: string
  founded?: string
  engagement?: string
}

export function HomeBannerBlock({ data }: BlockComponentProps<HomeBannerData>) {
  const { title, founded, engagement } = data

  return (
    <>
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-16 py-8 relative max-[600px]:px-8">
        <h1
          className="font-heading text-[clamp(2rem,4.5vw,3.5rem)] font-normal leading-[1.25] max-w-[860px] tracking-[0.01em]"
          style={{
            opacity: 0,
            transform: 'translateY(30px)',
            animation: 'fadeUp 1s ease forwards 0.3s',
          }}
          dangerouslySetInnerHTML={{ __html: title ?? '' }}
        />

        <div
          className="absolute bottom-12 flex flex-col items-center gap-2"
          style={{ opacity: 0, animation: 'fadeUp 1s ease forwards 1.2s' }}
        >
          <span className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-nb-text-secondary">
            Scroll
          </span>
          <div className="w-px h-9 bg-nb-divider relative overflow-hidden">
            <span
              className="absolute left-0 w-px h-full bg-nb-highlight"
              style={{ top: '-100%', animation: 'pulseLine 2s ease infinite' }}
            />
          </div>
        </div>
      </section>

      <section className="flex justify-center gap-16 py-11 px-16 border-y border-nb-divider max-[900px]:gap-8 max-[900px]:flex-wrap max-[600px]:flex-col max-[600px]:items-center max-[600px]:gap-3">
        {founded && (
          <span
            className="text-[0.8rem] font-normal tracking-[0.12em] uppercase text-nb-text-secondary"
            dangerouslySetInnerHTML={{ __html: founded }}
          />
        )}
        {engagement && (
          <span
            className="text-[0.8rem] font-normal tracking-[0.12em] uppercase text-nb-text-secondary"
            dangerouslySetInnerHTML={{ __html: engagement }}
          />
        )}
      </section>
    </>
  )
}

export { homeBannerSchema } from '@/blocks/home/schemas'
