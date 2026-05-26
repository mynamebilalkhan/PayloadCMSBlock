import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

const POSTS = [
  { date: 'February 2026', title: 'What most companies get wrong about offshore engineering', excerpt: "The biggest mistake isn't choosing the wrong vendor. It's treating offshore engineers like a different category of human being. Here's what actually determines whether an offshore engagement succeeds or fails." },
  { date: 'January 2026', title: "Why your Series B doesn't need a $400/hr consultancy", excerpt: "You're burning cash on brand-name consulting firms when what you actually need is senior engineers who can ship code. Here's the math most CTOs don't do." },
  { date: 'December 2025', title: 'The question you should ask before hiring an offshore team', excerpt: "It's not \"what's your hourly rate?\" It's not \"what technologies do you use?\" The question that actually predicts success is simpler than you think." },
  { date: 'November 2025', title: "We've been in business for 30 years. Here's what hasn't changed.", excerpt: "Technologies change every few years. Languages come and go. Frameworks rise and fall. But the things that make an engineering engagement work haven't changed since 1996." },
]

export default function StraightTalkPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Straight Talk
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Honest, opinionated perspectives from 30 years of building engineering teams. Not a blog.
        </p>
      </section>

      <RevealGroup className="max-w-[750px] mx-auto px-8 pt-8 pb-24">
        {POSTS.map((post, i) => (
          <a key={i} href="#" className="reveal block py-12 border-b border-nb-divider no-underline text-inherit transition-opacity duration-200 hover:opacity-70">
            <div className="text-[0.75rem] font-medium tracking-[0.1em] uppercase text-nb-text-secondary mb-3">{post.date}</div>
            <div className="font-heading text-[1rem] font-normal tracking-[0.01em] mb-3">{post.title}</div>
            <div className="text-[0.95rem] font-normal leading-[1.7] text-nb-text-secondary">{post.excerpt}</div>
          </a>
        ))}
      </RevealGroup>

      <RevealGroup className="py-24 px-16 border-t border-nb-divider max-[900px]:py-16 max-[900px]:px-8">
        <h2 className="reveal font-heading text-[clamp(1.3rem,2.5vw,1.8rem)] font-normal tracking-[0.01em] mb-6">
          Ready when you are.
        </h2>
        <a href="/start-a-conversation" className="reveal inline-block text-nb-btn font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 no-underline transition-colors duration-200 hover:bg-nb-highlight">
          start a conversation
        </a>
      </RevealGroup>
    </>
  )
}
