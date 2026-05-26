import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'
import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'

export default function HardwareDesignPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Hardware Design
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          CAD, mechanical engineering, prototyping. Engineering that you can hold in your hands.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we design</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            PCB layout and design, mechanical enclosures, thermal management, DFM optimization. Our hardware engineers work alongside firmware and software teams to deliver complete product solutions — not isolated components.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6 mt-10">Tools and process</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Altium, KiCad, SolidWorks, AutoCAD. We design for manufacturability from day one, working with your supply chain and contract manufacturers to ensure what we design can actually be built at scale.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            <em className="not-italic text-nb-text font-medium">Our mechanical engineers in Lahore perform work typically done by engineers costing 2–3x more in the US. Same CAD tools, same standards, same output quality.</em>
          </p>
        </div>
      </RevealGroup>

      {/* ── Gallery ───────────────────────────────────────────────── */}
      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-4">Work product</h2>
        <p className="reveal text-[1.05rem] font-normal leading-[1.85] text-nb-text-secondary max-w-[600px] mb-12">
          Real hardware designed by our teams.
        </p>
        <div className="grid grid-cols-4 gap-4 max-w-[1100px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-2">
          <div className="reveal aspect-square bg-nb-dark relative overflow-hidden">
            <video src="/media/videos/floor-16x9.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 text-[0.5rem] font-medium tracking-[0.1em] uppercase text-white/60">Video</span>
          </div>
          <PhotoPlaceholder label="Real photo" sublabel="Mechanical assembly" className="reveal aspect-square" />
          <div className="reveal aspect-square bg-nb-dark relative overflow-hidden">
            <video src="/media/videos/floor-16x9.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 text-[0.5rem] font-medium tracking-[0.1em] uppercase text-white/60">Video</span>
          </div>
          <PhotoPlaceholder label="Real photo" sublabel="Finished product" className="reveal aspect-square" />
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Need hardware engineers?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
