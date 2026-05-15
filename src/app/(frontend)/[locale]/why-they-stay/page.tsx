import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function WhyTheyStayPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Why They Stay
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          The offshore engineering industry has an attrition problem. We don&apos;t.
        </p>
      </section>

      {/* ── Split section ─────────────────────────────────────────── */}
      <RevealGroup className="border-t border-nb-divider">
        <div className="reveal grid grid-cols-2 min-h-[500px] max-[900px]:grid-cols-1">
          <div className="flex flex-col justify-center px-16 py-20 max-w-[560px] max-[900px]:px-8 max-[900px]:py-12">
            <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">The industry problem</h2>
            <p className="text-[1rem] font-normal leading-[1.85] text-nb-text-secondary">
              The average outsourcing firm turns over 25–30% of its engineers every year. That means your team is different every six months. Institutional knowledge walks out the door. Onboarding never ends. You&apos;re paying for senior engineers but getting a revolving door of people who barely know your codebase.
            </p>
          </div>
          <div className="bg-nb-dark flex items-center justify-center min-h-[300px] overflow-hidden">
            <video src="/media/videos/floor-16x9.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </RevealGroup>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Our numbers</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            At NEXTBRIDGE, annual attrition is under 5%. Average engineer tenure is over 8 years. These aren&apos;t aspirational targets — they&apos;re our actual numbers.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Our engineers stay because they work on real products with real US teams — not maintenance projects shuffled between bodies. They have career paths, competitive compensation, and the kind of work that makes senior engineers want to stay senior engineers rather than jumping to management or a competitor.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            <em className="not-italic text-nb-text font-medium">When we place an engineer on your team, they stay on your team.</em>
          </p>
        </div>
      </RevealGroup>

      {/* ── Numbers strip ─────────────────────────────────────────── */}
      <RevealGroup className="px-16 max-[900px]:px-8">
        <div className="reveal flex gap-20 py-14 border-y border-nb-divider max-w-[900px] max-[900px]:flex-wrap max-[900px]:gap-12">
          {[
            { num: '<5%', label: 'Annual attrition' },
            { num: '8.4', label: 'Avg years tenure' },
            { num: '25-30%', label: 'Industry average attrition' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <span className="font-heading text-[2.2rem] font-normal tracking-[0.02em] text-nb-text leading-none">{item.num}</span>
              <span className="mt-2 text-[0.75rem] font-medium tracking-[0.12em] uppercase text-nb-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          See who stays.
        </h2>
        <a href="/our-engineers" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          Meet Our Engineers
        </a>
      </RevealGroup>
    </>
  )
}
