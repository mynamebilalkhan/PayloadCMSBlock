import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function CareersPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Careers
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Build your career building other people&apos;s products. It&apos;s more interesting than it sounds.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Why NEXTBRIDGE</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Our engineers don&apos;t work on internal tools or legacy maintenance. They work on production products for some of the fastest-growing technology companies in the United States. Fintech, healthtech, SaaS, robotics, embedded systems — the work is as varied and challenging as anything you&apos;d find at a Silicon Valley startup.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            Average tenure is over 8 years. Annual attrition is under 5%. People stay because the work is good, the pay is competitive, and the career paths are real.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we look for</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            Technical excellence is the baseline. Beyond that, we look for engineers who communicate clearly, work independently, and care about the craft of building software. Our acceptance rate is under 3% — not because we&apos;re elitist, but because our clients expect exceptional engineers and we refuse to lower the bar.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Open roles</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-6">
            We&apos;re always looking for senior engineers across all disciplines — software, firmware, hardware, DevOps, AI/ML. If you&apos;re in Lahore and you&apos;re exceptional, we want to hear from you.
          </p>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            <em className="not-italic text-nb-text font-medium">
              Send your CV to{' '}
              <a href="mailto:careers@nextbridge.com" className="text-nb-highlight no-underline hover:underline">
                careers@nextbridge.com
              </a>
            </em>
          </p>
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Ready to build something that matters?
        </h2>
        <a href="mailto:careers@nextbridge.com" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          Get in Touch
        </a>
      </RevealGroup>
    </>
  )
}
