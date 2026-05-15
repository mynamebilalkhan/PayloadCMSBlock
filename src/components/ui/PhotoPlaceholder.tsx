import React from 'react'

interface PhotoPlaceholderProps {
  label?: string
  sublabel?: string
  className?: string
}

export function PhotoPlaceholder({ label, sublabel, className = '' }: PhotoPlaceholderProps) {
  return (
    <div
      className={[
        'w-full bg-nb-photo-bg flex items-center justify-center',
        className,
      ].join(' ')}
    >
      {(label || sublabel) && (
        <div className="text-[0.75rem] font-medium tracking-[0.15em] uppercase text-nb-text-secondary text-center p-4 leading-[1.8]">
          {label}
          {sublabel && (
            <span className="block text-[0.7rem] font-normal tracking-[0.1em] text-[#9B9990] mt-1">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
