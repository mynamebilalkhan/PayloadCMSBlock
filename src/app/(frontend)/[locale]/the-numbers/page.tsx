import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

const STATS = [
  { num: '1996', label: 'Founded' },
  { num: '550+', label: 'Engineers' },
  { num: '4+ yrs', label: 'Average engagement length' },
  { num: '4.2%', label: 'Annual attrition' },
  { num: '8.4 yrs', label: 'Average engineer tenure' },
  { num: '72%', label: 'Senior engineers' },
  { num: '100+', label: 'Active clients' },
  { num: '<3%', label: 'Hiring acceptance rate' },
  { num: '0', label: 'Clients lost during COVID' },
]

export default function TheNumbersPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          The Numbers
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          No narrative. Just the facts.
        </p>
      </section>

      <RevealGroup className="py-24 px-16 max-w-[1100px] mx-auto max-[900px]:py-16 max-[900px]:px-8">
        <div className="grid grid-cols-3 gap-12 max-[900px]:grid-cols-2 max-[900px]:gap-8 max-[600px]:grid-cols-1">
          {STATS.map((item, i) => (
            <div key={i} className="reveal flex flex-col py-8 border-t-2 border-nb-divider">
              <span className="font-heading text-[2.5rem] font-normal tracking-[0.02em] text-nb-text leading-none">{item.num}</span>
              <span className="mt-2 text-[0.75rem] font-medium tracking-[0.12em] uppercase text-nb-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Numbers work better in conversation.
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
