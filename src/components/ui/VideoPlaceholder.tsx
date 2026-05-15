import React from 'react'

interface VideoPlaceholderProps {
  label?: string
  sublabel?: string
  specs?: string
  className?: string
}

export function VideoPlaceholder({ label, sublabel, specs, className = '' }: VideoPlaceholderProps) {
  return (
    <div
      className={[
        'relative w-full h-full bg-nb-dark flex flex-col items-center justify-center',
        className,
      ].join(' ')}
      style={{
        background: 'linear-gradient(135deg, rgba(26,26,24,0.95) 0%, rgba(40,40,36,0.9) 100%)',
      }}
    >
      <div className="relative z-10 w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="ml-0.5">
          <polygon points="5,3 13,8 5,13" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>
      {label && (
        <div className="relative z-10 text-[0.7rem] font-medium tracking-[0.18em] uppercase text-white/50 text-center px-8 leading-[1.8]">
          {label}
          {sublabel && (
            <span className="block text-[0.62rem] font-normal tracking-[0.1em] text-white/25 mt-1">
              {sublabel}
            </span>
          )}
        </div>
      )}
      {specs && (
        <div className="absolute bottom-4 right-5 z-10 text-[0.55rem] font-medium tracking-[0.12em] uppercase text-white/20">
          {specs}
        </div>
      )}
    </div>
  )
}
