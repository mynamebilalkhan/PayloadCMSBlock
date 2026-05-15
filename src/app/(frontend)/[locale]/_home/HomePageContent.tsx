import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export function HomePageContent() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-16 py-8 relative max-[600px]:px-8">
        <h1
          className="font-heading text-[clamp(2rem,4.5vw,3.5rem)] font-normal leading-[1.25] max-w-[860px] tracking-[0.01em]"
          style={{
            opacity: 0,
            transform: 'translateY(30px)',
            animation: 'fadeUp 1s ease forwards 0.3s',
          }}
        >
          engineering since&nbsp;
          <span className="font-medium text-nb-highlight">1996.</span>
        </h1>

        {/* Scroll hint */}
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

      {/* ── Proof strip ─────────────────────────────────────────── */}
      <section className="flex justify-center gap-16 py-11 px-16 border-y border-nb-divider max-[900px]:gap-8 max-[900px]:flex-wrap max-[600px]:flex-col max-[600px]:items-center max-[600px]:gap-3">
        <span className="text-[0.8rem] font-normal tracking-[0.12em] uppercase text-nb-text-secondary">
          <b className="font-medium text-nb-text">Founded</b> 1996
        </span>
        <span className="text-[0.8rem] font-normal tracking-[0.12em] uppercase text-nb-text-secondary">
          <b className="font-medium text-nb-text">Average Engagement</b> 4+ Years
        </span>
      </section>

      {/* ── Engineering floor video ──────────────────────────────── */}
      <RevealGroup>
        <div className="reveal w-full bg-nb-dark aspect-[16/9] max-h-[580px] overflow-hidden max-[900px]:aspect-[4/3] max-[900px]:max-h-[360px] max-[600px]:aspect-[3/2] max-[600px]:max-h-none">
          <video
            src="/media/videos/floor-16x9.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover block"
          />
        </div>
      </RevealGroup>

      {/* ── Story ────────────────────────────────────────────────── */}
      <RevealGroup className="max-w-[700px] mx-auto px-8 py-32 max-[900px]:py-20">
        <p className="reveal font-heading text-[clamp(1.1rem,2vw,1.35rem)] font-normal leading-[1.6] tracking-[0.01em] text-nb-text mb-12">
          Most engineering services companies are built to sell.
          <br />
          <strong className="font-medium">We were built to deliver.</strong>
        </p>
        <p className="reveal text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
          For three decades, NEXTBRIDGE has been embedding senior engineers into product teams at some of the fastest-growing technology companies in the United States. We don&apos;t run marketing campaigns. We don&apos;t compete on price. We don&apos;t chase trends.
        </p>
        <p className="reveal text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
          <em className="not-italic text-nb-text font-medium">We compete on one thing: the quality of our people.</em>
        </p>
        <p className="reveal text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
          Our engineers aren&apos;t contractors cycling through a bench. They&apos;re career professionals — many with over a decade at NEXTBRIDGE — who integrate into your team, learn your codebase, attend your standups, and ship your product. When we place an engineer, they stay. When we start a client relationship, it tends to last years, not months.
        </p>
        <p className="reveal mt-12 pt-12 border-t border-nb-divider text-[1.1rem] font-light leading-[1.65] text-nb-text">
          We&apos;re talking to you now. Not because anything has changed about how we work. We just decided the work deserves to be seen.
        </p>
      </RevealGroup>

      {/* ── Doors ────────────────────────────────────────────────── */}
      <section className="bg-nb-dark py-24 px-16 max-[900px]:py-16 max-[900px]:px-8">
        <RevealGroup className="max-w-[1100px] mx-auto grid grid-cols-3 gap-6 max-[900px]:grid-cols-1">
          {[
            { title: "See what we've built.", body: 'Three decades of engineering work across fintech, healthtech, SaaS, embedded systems, and more.', link: 'experience', href: '/client-stories' },
            { title: 'Meet the engineers.', body: "Here's who they are, where they come from, and why they stay.", link: 'our engineers', href: '/our-engineers' },
            { title: "Let's have a conversation.", body: "No chatbot. No scheduling link. Tell us what you need and we'll call you.", link: 'start a conversation', href: '/start-a-conversation' },
          ].map((door, i) => (
            <a
              key={i}
              href={door.href}
              className="reveal group flex flex-col p-11 border border-white/[0.07] no-underline transition-all duration-300 hover:border-nb-highlight hover:-translate-y-[3px]"
            >
              <h3 className="font-heading text-[1rem] font-normal tracking-[0.01em] text-nb-dark-text mb-3">{door.title}</h3>
              <p className="text-[0.92rem] font-normal leading-[1.7] text-nb-dark-muted mb-auto pb-6">{door.body}</p>
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

      {/* ── Voices ───────────────────────────────────────────────── */}
      <RevealGroup className="max-w-[1100px] mx-auto px-16 py-32 max-[900px]:px-8 max-[900px]:py-20">
        <div className="reveal text-[0.7rem] font-medium tracking-[0.2em] uppercase text-nb-text-secondary mb-14">
          What our clients say
        </div>
        <div className="grid grid-cols-3 gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-10">
          {[
            { quote: '"We started with two engineers. Four years later, NEXTBRIDGE runs our entire backend infrastructure."', name: 'VP Engineering', company: 'Series C Fintech' },
            { quote: '"I\'ve worked with offshore teams my entire career. This is the only one that actually feels like part of our company."', name: 'CTO', company: 'Growth-Stage SaaS' },
            { quote: '"They don\'t oversell. They just deliver. Every time."', name: 'Head of Product', company: 'Series B Healthtech' },
          ].map((v, i) => (
            <div key={i} className="reveal pl-6 border-l-2 border-nb-divider transition-colors duration-300 hover:border-l-nb-highlight">
              <blockquote className="text-[1.05rem] font-normal leading-[1.65] text-nb-text mb-5 tracking-[-0.005em] not-italic">{v.quote}</blockquote>
              <cite className="not-italic text-[0.82rem] font-normal text-nb-text-secondary block leading-[1.5]">
                <strong className="font-medium text-nb-text block">{v.name}</strong>
                {v.company}
              </cite>
            </div>
          ))}
        </div>
      </RevealGroup>

      {/* ── Close CTA ────────────────────────────────────────────── */}
      <RevealGroup className="text-center py-32 px-16 border-t border-nb-divider max-[900px]:py-20 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.5rem,3vw,2.2rem)] font-normal tracking-[0.01em] text-nb-text mb-8">
          Ready when you are.
        </h2>
        <a
          href="/start-a-conversation"
          className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight"
        >
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
