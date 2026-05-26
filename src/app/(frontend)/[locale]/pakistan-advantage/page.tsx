import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function PakistanAdvantagePage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          The Pakistan Advantage
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Why Pakistan. Why Lahore. Why it matters for your engineering team.
        </p>
      </section>

      {/* ── Split section ─────────────────────────────────────────── */}
      <RevealGroup className="border-t border-nb-divider">
        <div className="reveal grid grid-cols-2 min-h-[500px] max-[900px]:grid-cols-1">
          <div className="flex flex-col justify-center px-16 py-20 max-w-[560px] max-[900px]:px-8 max-[900px]:py-12">
            <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Beyond the default</h2>
            <p className="text-[1rem] font-normal leading-[1.85] text-nb-text-secondary mb-4">
              Most US companies default to India for offshore engineering. It&apos;s familiar. But familiar isn&apos;t always better.
            </p>
            <p className="text-[1rem] font-normal leading-[1.85] text-nb-text-secondary">
              Pakistan produces over 25,000 IT graduates annually from world-class programs. English proficiency is high. The timezone overlaps with US East Coast business hours. And the talent market is less picked-over — our engineers aren&apos;t fielding three competing offers every month.
            </p>
          </div>
          <div className="bg-nb-dark flex items-center justify-center min-h-[300px] overflow-hidden">
            <video src="/media/videos/floor-16x9.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </RevealGroup>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">The retention difference</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            In India&apos;s major tech hubs, senior engineers are constantly recruited. Attrition rates of 25–30% are standard. Every engineer on your team is simultaneously considering three other offers.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            In Lahore, the dynamic is different. The talent is exceptional but the market is less saturated. Our engineers choose NEXTBRIDGE because the work is better than anything else available locally — and they stay because that remains true year after year.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            <em className="not-italic text-nb-text font-medium">The result: better retention, deeper commitment, and engineers who stay focused on your product instead of shopping for their next contract.</em>
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Fort Worth</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            We&apos;re not a faceless offshore operation. NEXTBRIDGE maintains a physical presence in Fort Worth, Texas. US contracts, US legal framework, a US point of contact. The engineering happens in Lahore. The business relationship is American.
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          See the people behind the advantage.
        </h2>
        <a href="/our-engineers" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          Meet Our Engineers
        </a>
      </RevealGroup>
    </>
  )
}
