import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function MotorsportsPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Nextbridge Motorsports
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Off-road racing. Engineering applied to dirt, sand, and speed.
        </p>
      </section>

      {/* ── Split section ─────────────────────────────────────────── */}
      <RevealGroup className="border-t border-nb-divider">
        <div className="reveal grid grid-cols-2 min-h-[500px] max-[900px]:grid-cols-1">
          <div className="flex flex-col justify-center px-16 py-20 max-w-[560px] max-[900px]:px-8 max-[900px]:py-12">
            <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Why motorsports</h2>
            <p className="text-[1rem] font-normal leading-[1.85] text-nb-text-secondary mb-4">
              NEXTBRIDGE is an engineering company. Motorsports is engineering at its most visceral — real-time problem solving, mechanical precision, and the kind of performance pressure that reveals what a team is made of.
            </p>
            <p className="text-[1rem] font-normal leading-[1.85] text-nb-text-secondary">
              Nextbridge Motorsports is our off-road racing team, targeting the Thal Desert Rally in late 2026 with Team Captain Zulaykha &quot;Leica&quot; Niazi as lead driver.
            </p>
          </div>
          <div className="bg-nb-dark flex items-center justify-center min-h-[300px] overflow-hidden">
            <video src="/media/videos/floor-16x9.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </RevealGroup>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Engineering meets sand</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Everything about the racing program connects back to what we do. Vehicle telemetry, suspension tuning, navigation systems, progressive autonomy research — it&apos;s all engineering. The desert just makes it more interesting.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            Follow the team&apos;s journey as we prepare for the 2026 Thal Desert Rally.
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Want to know more?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
