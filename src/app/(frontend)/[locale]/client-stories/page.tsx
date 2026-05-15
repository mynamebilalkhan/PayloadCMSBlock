import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

const STORIES = [
  { title: 'Series C Fintech — Payments Engine Rebuild', body: 'Platform processing $2B in annual transactions needed to rebuild their core payments engine in six months. NEXTBRIDGE embedded eight senior engineers who shipped on time and stayed for four more years.' },
  { title: 'Growth-Stage SaaS — Backend Team Scaling', body: 'Started with two engineers as a trial. Within 18 months, NEXTBRIDGE was running the entire backend infrastructure with a team of twelve. Five-year engagement and counting.' },
  { title: 'Series B Healthtech — Mobile Platform', body: 'Needed iOS and Android teams that could work directly with US product and design. NEXTBRIDGE placed six mobile engineers who integrated seamlessly from day one.' },
  { title: 'Industrial Robotics — Firmware Development', body: 'California-based robotics company needed embedded systems engineers with real hardware experience. NEXTBRIDGE provided a team of three firmware specialists who are still building control systems three years later.' },
  { title: 'Pre-IPO SaaS — DevOps Transformation', body: 'Legacy infrastructure couldn\'t support the scale needed for IPO readiness. NEXTBRIDGE DevOps team rebuilt CI/CD pipelines, migrated to Kubernetes, and reduced deployment time from days to minutes.' },
  { title: 'Series A E-Commerce — Zero-to-One Build', body: 'Founding team had a vision but no engineering capacity. NEXTBRIDGE built the entire platform from scratch — frontend, backend, infrastructure — and handed off a production-ready product in four months.' },
]

export default function ClientStoriesPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Experience
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Three decades of engineering. Here are some of the stories.
        </p>
      </section>

      <RevealGroup className="py-24 px-16 max-w-[1100px] mx-auto max-[900px]:py-16 max-[900px]:px-8">
        <div className="reveal text-[0.7rem] font-medium tracking-[0.2em] uppercase text-nb-text-secondary mb-12">
          Client Stories
        </div>
        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
          {STORIES.map((story, i) => (
            <div key={i} className="reveal block p-10 border border-nb-divider transition-all duration-300 hover:border-nb-highlight hover:-translate-y-0.5 cursor-default">
              <h3 className="font-heading text-[0.9rem] font-normal mb-3 tracking-[0.01em]">{story.title}</h3>
              <p className="text-[0.92rem] font-normal leading-[1.7] text-nb-text-secondary">{story.body}</p>
            </div>
          ))}
        </div>
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Want to be the next story?
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
