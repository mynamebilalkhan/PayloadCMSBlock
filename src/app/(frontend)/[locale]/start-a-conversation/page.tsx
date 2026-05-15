import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function StartAConversationPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Let&apos;s talk.
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          Tell us what you need. We&apos;ll call you within one business day.
        </p>
      </section>

      <RevealGroup className="max-w-[550px] px-16 pt-8 pb-24 max-[900px]:px-8 max-[900px]:pb-16">
        <form className="flex flex-col gap-8">
          {[
            { id: 'name', label: 'Your name', type: 'text' },
            { id: 'company', label: 'Your company', type: 'text' },
            { id: 'email', label: 'Your email', type: 'email' },
            { id: 'phone', label: 'Your phone number', type: 'tel' },
          ].map((field) => (
            <div key={field.id} className="reveal flex flex-col gap-2">
              <label
                htmlFor={field.id}
                className="text-[0.8rem] font-medium tracking-[0.08em] uppercase text-nb-text-secondary"
              >
                {field.label}
              </label>
              <input
                type={field.type}
                id={field.id}
                name={field.id}
                className="w-full py-3 bg-transparent border-0 border-b border-nb-divider text-[1rem] font-normal text-nb-text outline-none transition-colors duration-200 focus:border-b-nb-text"
              />
            </div>
          ))}

          <div className="reveal flex flex-col gap-2">
            <label htmlFor="message" className="text-[0.8rem] font-medium tracking-[0.08em] uppercase text-nb-text-secondary">
              What are you looking for?
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full py-3 bg-transparent border-0 border-b border-nb-divider text-[1rem] font-normal text-nb-text outline-none resize-y min-h-[100px] transition-colors duration-200 focus:border-b-nb-text"
            />
          </div>

          <button
            type="submit"
            className="reveal self-start text-[0.82rem] font-medium tracking-[0.15em] uppercase text-nb-bg bg-nb-text px-10 py-4 border-none cursor-pointer transition-colors duration-200 hover:bg-nb-highlight"
          >
            Send
          </button>

          <p className="reveal text-[0.88rem] text-nb-text-secondary">
            Prefer email? Reach us at{' '}
            <a href="mailto:hello@nextbridge.com" className="text-nb-text">
              hello@nextbridge.com
            </a>
          </p>
        </form>
      </RevealGroup>
    </>
  )
}
