import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function CloudInfrastructurePage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Cloud &amp; Infrastructure
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          The operational backbone that lets your product team ship faster without breaking things.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we manage</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            AWS, Azure, GCP — we work across all three and help clients choose the right platform for their scale and requirements. Container orchestration with Kubernetes and Docker. CI/CD pipelines that turn deployments from all-day events into automated, confidence-building routines.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6 mt-10">The impact</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Our DevOps teams have reduced deployment times from days to minutes. Migrated legacy on-prem infrastructure to cloud without downtime. Built monitoring and alerting systems that catch problems before users do.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            <em className="not-italic text-nb-text font-medium">Infrastructure isn&apos;t glamorous. But when it works, everything else works.</em>
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Security and compliance</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            SOC 2 readiness, HIPAA-compliant architectures, encryption at rest and in transit. Our infrastructure engineers understand that for Series B and beyond, security isn&apos;t optional — it&apos;s a fundraising requirement.
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Infrastructure keeping you up at night?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
