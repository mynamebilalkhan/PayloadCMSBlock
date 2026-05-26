import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'
import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'

const LEADERS = [
  {
    photoLabel: 'Real photo',
    photoSublabel: 'Founder portrait — candid, not corporate',
    name: 'MM',
    role: 'Founder & CEO',
    tenure: 'In the industry since 1993',
    detail: 'Started building engineering teams three years before NEXTBRIDGE existed. 33 years later, still hands-on. Splits time between Fort Worth and Lahore. Builds robots in his spare time.',
  },
  {
    photoLabel: 'Real photo',
    photoSublabel: 'Candid, in the Lahore office',
    name: '[VP Engineering]',
    role: 'VP Engineering, Lahore',
    tenure: '[X] years at NEXTBRIDGE',
    detail: 'Oversees the engineering floor in Lahore. Responsible for technical quality across all client engagements. The person who makes sure your engineers are the right engineers.',
  },
  {
    photoLabel: 'Real photo',
    photoSublabel: 'Candid, natural',
    name: '[Director of Operations]',
    role: 'Director of Operations',
    tenure: '[X] years at NEXTBRIDGE',
    detail: 'Runs the day-to-day. Onboarding, staffing, client communication, delivery management. The engine room.',
  },
]

export default function LeadershipPage() {
  return (
    <>
      {/* ── Page hero ────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Leadership
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          The people who run NEXTBRIDGE. Not a board of advisors — the people who actually show up every day.
        </p>
      </section>

      {/* ── Profiles ─────────────────────────────────────────────── */}
      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <div className="grid grid-cols-3 gap-10 max-w-[1100px] max-[900px]:grid-cols-2 max-[900px]:gap-8 max-[600px]:grid-cols-1">
          {LEADERS.map((person, i) => (
            <div key={i} className="reveal flex flex-col">
              <PhotoPlaceholder
                label={person.photoLabel}
                sublabel={person.photoSublabel}
                className="aspect-[4/5] mb-5"
              />
              <div className="text-[1.05rem] font-medium tracking-[-0.005em] mb-1">{person.name}</div>
              <div className="text-[0.88rem] font-normal text-nb-text-secondary mb-2">{person.role}</div>
              <div className="text-[0.78rem] font-medium text-nb-highlight tracking-[0.03em]">{person.tenure}</div>
              <p className="mt-3 text-[0.88rem] font-normal leading-[1.65] text-nb-text-secondary">{person.detail}</p>
            </div>
          ))}
        </div>
      </RevealGroup>

      {/* ── Page CTA ─────────────────────────────────────────────── */}
      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Ready to talk?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
