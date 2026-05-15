import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function HowWeFindThemPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          How We Find Them
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          550+ engineers didn&apos;t happen by accident. Here&apos;s the process behind the people.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">The pipeline</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Pakistan produces over 25,000 IT graduates every year from programs that compete with the best in the world. We recruit from the top of that pool — LUMS, NUST, FAST, UET, GIKI — and screen for more than technical ability.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            We look for engineers who can communicate clearly in English, work independently with a US team, and commit to the kind of long-term client relationships that define our model.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">The bar</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            Our acceptance rate is under 3%. We test for deep technical proficiency, problem-solving ability, communication skills, and cultural fit. Multiple rounds, multiple interviewers, real-world coding challenges — not algorithm puzzles.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">From hire to placement</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            Engineers who join NEXTBRIDGE go through an onboarding process designed around US client expectations — communication standards, collaboration tools, agile workflows, timezone management. By the time they join your team, they&apos;re ready to contribute in week one.
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Ready to see the caliber?
        </h2>
        <a href="/our-engineers" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          Meet Our Engineers
        </a>
      </RevealGroup>
    </>
  )
}
