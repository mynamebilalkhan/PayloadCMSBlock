import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function WhereWereGoingPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Where We&apos;re Going
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Thirty years in. Here&apos;s what&apos;s next.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Growing the bench</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            We&apos;re expanding aggressively. More engineers, deeper specialization, broader capability. The demand for senior engineering talent isn&apos;t slowing down, and neither are we. Our goal is simple: be ready when you need us, with exactly the people you need.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6 mt-10">Deeper into AI</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Every client conversation now includes AI. Not as a buzzword — as a real engineering discipline that requires real engineers. We&apos;re investing in machine learning, computer vision, and NLP capabilities so our teams can build what&apos;s coming next, not just what&apos;s already here.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6 mt-10">The same things that matter</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Growth doesn&apos;t mean change. We&apos;re not pivoting to consulting. We&apos;re not building a product. We&apos;re not chasing a different market. We&apos;re doing what we&apos;ve always done — embedding exceptional engineers into your team — and doing more of it.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            <em className="not-italic text-nb-text font-medium">The model works. We&apos;re scaling the model.</em>
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Want to be part of what&apos;s next?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
