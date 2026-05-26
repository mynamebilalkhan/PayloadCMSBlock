import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function SoftwarePage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Software
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Web applications, mobile platforms, APIs, microservices, data pipelines. The core of what our engineers build every day.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we build</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Our software teams build the products our clients ship. Full-stack web applications in React and Next.js. Native and cross-platform mobile apps in Swift, Kotlin, and React Native. RESTful and GraphQL APIs that handle millions of requests. Microservices architectures that scale with the business.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            We don&apos;t build demos or prototypes that need to be rebuilt by someone else. We build production systems that run real businesses.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">How we build</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Our engineers follow your process, not ours. Your sprint cadence, your code review standards, your deployment pipeline. If you use GitHub, we&apos;re in GitHub. If you&apos;re on Jira, we&apos;re on Jira. The goal is integration, not disruption.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            <em className="not-italic text-nb-text font-medium">We write code that your in-house team can read, review, and maintain without a translator.</em>
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Depth, not logos</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            We could list 40 technology logos here. Instead: our React and Next.js teams have been building production applications for companies processing millions of daily transactions. Our backend engineers work in Node.js, Python, Go, and Java — choosing the right tool for the problem, not the trend. Our mobile teams have shipped over 50 production applications across iOS and Android.
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Need software engineers?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
