import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

const CHALLENGES = [
  { title: 'Rapid Team Scaling', body: 'You need five senior engineers next month, not next quarter. We have the bench depth and the onboarding process to make it happen without sacrificing quality.' },
  { title: 'Legacy System Modernization', body: 'Your monolith needs to become microservices. Your on-prem needs to become cloud. Our teams have done this migration dozens of times across multiple technology stacks.' },
  { title: 'Zero-to-One Product Builds', body: 'You have a roadmap but no engineering team. We build the entire product — frontend, backend, infrastructure — and hand off clean, maintainable code.' },
  { title: 'Long-Term Embedded Engineering', body: 'This is what we do best. Engineers who join your team and stay for years. They learn your domain, your codebase, your culture. They become indistinguishable from your in-house team.' },
  { title: 'Specialized Technical Capability', body: "Firmware, embedded systems, hardware design, AI/ML. Capabilities most offshore firms don't touch. We have engineers who've been building in these spaces for a decade." },
  { title: 'DevOps & Infrastructure', body: 'CI/CD pipelines, cloud migration, Kubernetes, monitoring. The operational backbone that lets your product team ship faster without breaking things.' },
]

export default function ByChallengeTypePage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          By Challenge Type
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Different problems, same approach: the right engineers, embedded in your team.
        </p>
      </section>

      <RevealGroup className="py-24 px-16 max-w-[1100px] mx-auto max-[900px]:py-16 max-[900px]:px-8">
        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
          {CHALLENGES.map((card, i) => (
            <a key={i} href="/client-stories" className="reveal block p-10 border border-nb-divider no-underline text-inherit transition-all duration-300 hover:border-nb-highlight hover:-translate-y-0.5">
              <h3 className="font-heading text-[0.9rem] font-normal mb-3 tracking-[0.01em]">{card.title}</h3>
              <p className="text-[0.92rem] font-normal leading-[1.7] text-nb-text-secondary">{card.body}</p>
            </a>
          ))}
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Which challenge is yours?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
