import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'
import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'

const ENGINEERS = [
  { name: 'Amir Hassan', role: 'Senior Software Engineer', tenure: '11 years at NEXTBRIDGE', detail: 'Full-stack engineer specializing in React and Node.js. Has been embedded in the same fintech client team for 6 years.' },
  { name: 'Sara Malik', role: 'Lead iOS Engineer', tenure: '9 years at NEXTBRIDGE', detail: 'Built mobile applications used by over 2 million users. Mentors the mobile team across three client engagements.' },
  { name: 'Bilal Ahmed', role: 'Senior Firmware Engineer', tenure: '8 years at NEXTBRIDGE', detail: 'Embedded systems and real-time operating systems. Currently working on control firmware for an industrial robotics client.' },
  { name: 'Fatima Raza', role: 'Senior Backend Engineer', tenure: '7 years at NEXTBRIDGE', detail: 'Distributed systems and data infrastructure. Has architected systems processing over $1B in annual transactions.' },
  { name: 'Usman Tariq', role: 'DevOps Engineer', tenure: '6 years at NEXTBRIDGE', detail: 'Kubernetes, CI/CD, cloud infrastructure. Has led three major cloud migrations from on-prem to AWS.' },
  { name: 'Ayesha Khan', role: 'Senior Software Engineer', tenure: '5 years at NEXTBRIDGE', detail: 'Frontend and mobile specialist. Works directly with US product and design teams on daily standups.' },
]

export default function OurEngineersPage() {
  return (
    <>
      {/* ── Page hero ────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Our Engineers
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Today, over 550 engineers work from our offices in Lahore. Here&apos;s who they are.
        </p>
      </section>

      {/* ── Video ────────────────────────────────────────────────── */}
      <RevealGroup className="px-16 mb-16 max-[900px]:px-8 max-[900px]:mb-12 max-[600px]:px-0">
        <div className="reveal aspect-[16/9] max-h-[520px] bg-nb-dark overflow-hidden max-[900px]:aspect-[4/3] max-[900px]:max-h-[360px]">
          <video src="/media/videos/floor-16x9.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover block" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[0.78rem] font-normal text-nb-text-secondary">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C75050]" style={{ animation: 'blink 2s ease infinite' }} />
          Live from the engineering floor at NEXTBRIDGE Lahore.
        </div>
      </RevealGroup>

      {/* ── Numbers bar ──────────────────────────────────────────── */}
      <RevealGroup className="px-16 max-[900px]:px-8">
        <div className="reveal flex gap-20 py-14 border-y border-nb-divider max-w-[1100px] max-[900px]:flex-wrap max-[900px]:gap-12 max-[600px]:gap-8">
          {[
            { num: '550+', label: 'Engineers' },
            { num: '8.4', label: 'Avg years at Nextbridge' },
            { num: '4.2%', label: 'Annual attrition' },
            { num: '72%', label: 'Senior engineers' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <span className="font-heading text-[2.2rem] font-normal tracking-[0.02em] text-nb-text leading-none">{item.num}</span>
              <span className="mt-2 text-[0.75rem] font-medium tracking-[0.12em] uppercase text-nb-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </RevealGroup>

      {/* ── Content ──────────────────────────────────────────────── */}
      <RevealGroup className="max-w-[700px] px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Who they are</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Our engineers come from Pakistan&apos;s top computer science and electrical engineering programs — LUMS, NUST, FAST, UET Lahore, GIKI. They&apos;re not fresh graduates on a bench waiting for an assignment. The majority are mid-career and senior professionals with deep domain experience built over years of working with US product teams.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            They work in your timezone. They attend your standups. They use your tools. They commit to your repos.{' '}
            <em className="not-italic text-nb-text font-medium">They are, for all practical purposes, your team.</em>
          </p>
        </div>
      </RevealGroup>

      {/* ── Profiles grid ────────────────────────────────────────── */}
      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <div className="reveal text-[0.7rem] font-medium tracking-[0.2em] uppercase text-nb-text-secondary mb-14">
          Some of our people
        </div>
        <div className="grid grid-cols-3 gap-10 max-w-[1100px] max-[900px]:grid-cols-2 max-[900px]:gap-8 max-[600px]:grid-cols-1">
          {ENGINEERS.map((eng, i) => (
            <div key={i} className="reveal flex flex-col">
              <div className="w-full aspect-[4/5] bg-nb-dark relative overflow-hidden mb-5">
                <PhotoPlaceholder label="Photo" sublabel={eng.name} className="absolute inset-0" />
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[0.55rem] font-medium tracking-[0.12em] uppercase text-white/70 bg-black/50 px-2 py-1 backdrop-blur-[4px]">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#C75050] inline-block" />
                  Profile Video
                </div>
              </div>
              <div className="text-[1.05rem] font-medium tracking-[-0.005em] mb-1">{eng.name}</div>
              <div className="text-[0.88rem] font-normal text-nb-text-secondary mb-2">{eng.role}</div>
              <div className="text-[0.78rem] font-medium text-nb-highlight tracking-[0.03em]">{eng.tenure}</div>
              <p className="mt-3 text-[0.88rem] font-normal leading-[1.65] text-nb-text-secondary">{eng.detail}</p>
            </div>
          ))}
        </div>
      </RevealGroup>

      {/* ── Page CTA ─────────────────────────────────────────────── */}
      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Want to meet the team?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
