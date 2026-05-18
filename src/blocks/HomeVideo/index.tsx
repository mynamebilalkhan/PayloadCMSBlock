'use client'

import React from 'react'
import type { BlockComponentProps } from '@/renderer/types'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export interface HomeVideoData {
  src?: string
}

export function HomeVideoBlock({ data }: BlockComponentProps<HomeVideoData>) {
  const src = data.src ?? '/media/videos/floor-16x9.mp4'

  return (
    <RevealGroup>
      <div className="reveal w-full bg-nb-dark aspect-[16/9] max-h-[580px] overflow-hidden max-[900px]:aspect-[4/3] max-[900px]:max-h-[360px] max-[600px]:aspect-[3/2] max-[600px]:max-h-none">
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover block"
        />
      </div>
    </RevealGroup>
  )
}

export { homeVideoSchema } from '@/blocks/home/schemas'
