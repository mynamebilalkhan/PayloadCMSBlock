import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function AIMachineLearningPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          AI &amp; Machine Learning
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Real engineers building real AI systems. Not demos, not wrappers — production machine learning in your stack.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we build</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Machine learning models that run in production, not notebooks. Computer vision pipelines for industrial and consumer applications. Natural language processing for document understanding, search, and customer-facing features. Recommendation systems and predictive analytics integrated into existing product architectures.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6 mt-10">Depth, not hype</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Every client conversation now includes AI. We&apos;ve been building ML systems long enough to know which problems AI actually solves and which ones it doesn&apos;t. Our engineers won&apos;t oversell what the technology can do.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            <em className="not-italic text-nb-text font-medium">We build AI features that ship, not AI strategies that sit in decks.</em>
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Building something intelligent?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
