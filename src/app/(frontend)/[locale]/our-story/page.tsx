import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function OurStoryPage() {
  return (
    <>
      {/* ── Page hero ────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Our Story
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          NEXTBRIDGE started in 1996 in Lahore, Pakistan. We&apos;ve been here ever since.
        </p>
      </section>

      {/* ── Content ──────────────────────────────────────────────── */}
      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            In 1993, three years before NEXTBRIDGE existed, our founder was already building engineering teams. Matching Pakistani engineering talent with companies that needed it. Learning what worked, what failed, and what it actually took to make an offshore relationship succeed.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            By 1996, the lessons were clear enough to build a company around. NEXTBRIDGE was incorporated in Lahore with a simple premise: hire exceptional engineers, embed them in client teams, and let the quality of the work do the talking.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            That premise hasn&apos;t changed in 30 years.
          </p>
        </div>
      </RevealGroup>

      {/* ── Video ────────────────────────────────────────────────── */}
      <RevealGroup className="px-16 mb-16 max-[900px]:px-8 max-[900px]:mb-12 max-[600px]:px-0 max-[600px]:mb-10">
        <div className="reveal aspect-[16/9] max-h-[440px] bg-nb-dark overflow-hidden max-[900px]:aspect-[4/3] max-[900px]:max-h-[360px]">
          <video
            src="/media/videos/floor-16x9.mp4"
            autoPlay muted loop playsInline
            className="w-full h-full object-cover block"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[0.78rem] font-normal text-nb-text-secondary">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C75050]" style={{ animation: 'blink 2s ease infinite' }} />
          Inside NEXTBRIDGE Lahore.
        </div>
      </RevealGroup>

      {/* ── Timeline ─────────────────────────────────────────────── */}
      <RevealGroup className="max-w-[700px] px-16 pt-16 pb-24 max-[900px]:px-8 max-[900px]:pt-12 max-[900px]:pb-16">
        {[
          { year: '1996', title: 'Founded in Lahore', body: 'NEXTBRIDGE incorporated with a small team of engineers and a handful of US clients who took a chance on a new model.' },
          { year: '2002', title: 'First 100 engineers', body: 'Steady growth through referrals and repeat business. No marketing spend. Every new client came from an existing one.' },
          { year: '2008', title: 'US operations established', body: 'Opened the Fort Worth office to provide a physical US presence and closer alignment with client business hours.' },
          { year: '2015', title: '300+ engineers', body: 'Expanded into firmware, embedded systems, and hardware design — capabilities most offshore firms don\'t touch.' },
          { year: '2020', title: 'Navigated the pandemic without losing a single client', body: 'Remote-first operations meant zero disruption. Every engagement continued without interruption.' },
          { year: '2026', title: '550+ engineers and growing', body: 'Three decades in. Still founder-led. Still engineering-first. Still here.' },
        ].map((item, i) => (
          <div key={i} className="reveal py-10 border-b border-nb-divider grid grid-cols-[80px_1fr] gap-8 max-[600px]:grid-cols-1 max-[600px]:gap-2">
            <div className="text-[0.85rem] font-medium text-nb-highlight pt-1">{item.year}</div>
            <div>
              <h3 className="font-heading text-[0.85rem] font-normal mb-2 tracking-[0.01em]">{item.title}</h3>
              <p className="text-[0.95rem] font-normal leading-[1.75] text-nb-text-secondary">{item.body}</p>
            </div>
          </div>
        ))}
      </RevealGroup>

      {/* ── Page CTA ─────────────────────────────────────────────── */}
      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Want to know where we&apos;re headed?
        </h2>
        <a href="/where-were-going" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          where we&apos;re going
        </a>
      </RevealGroup>
    </>
  )
}
