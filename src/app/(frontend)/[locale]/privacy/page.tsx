import React from 'react'
import { RevealGroup } from '@/components/ui/RevealWrapper'

export default function PrivacyPage() {
  return (
    <>
      <section className="pt-40 pb-16 px-16 max-w-[800px] max-[900px]:pt-32 max-[900px]:pb-12 max-[900px]:px-8">
        <h1
          className="font-heading text-[clamp(1.8rem,3.8vw,2.8rem)] font-normal tracking-[0.01em] leading-[1.25]"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.2s' }}
        >
          Privacy Policy
        </h1>
        <p
          className="mt-6 text-[1.1rem] font-normal leading-[1.8] text-nb-text-secondary"
          style={{ opacity: 0, transform: 'translateY(25px)', animation: 'fadeUp 0.8s ease forwards 0.4s' }}
        >
          How we handle your information. Straightforward.
        </p>
      </section>

      <RevealGroup className="max-w-[700px] mx-auto px-16 py-24 max-[900px]:px-8 max-[900px]:py-16">
        <div className="reveal">
          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we collect</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            When you fill out our contact form, we collect your name, company, email, phone number, and whatever you write in the message field. That&apos;s it. We don&apos;t use tracking cookies, retargeting pixels, or third-party analytics that follow you around the internet.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">What we do with it</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            We use your information to respond to your inquiry. A human at NEXTBRIDGE will read your message and call or email you back. We don&apos;t sell your data, share it with third parties, or add you to marketing lists.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">How we store it</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary mb-10">
            Your contact information is stored securely and retained only as long as needed to maintain our business relationship. If you want us to delete your information, email us and we&apos;ll take care of it.
          </p>

          <h2 className="font-heading text-[1.2rem] font-normal tracking-[0.01em] mb-6">Questions</h2>
          <p className="text-[1.05rem] font-normal leading-[1.9] text-nb-text-secondary">
            If you have questions about how we handle your data, reach us at{' '}
            <a href="mailto:privacy@nextbridge.com" className="text-nb-highlight no-underline hover:underline">
              privacy@nextbridge.com
            </a>
          </p>
        </div>
      </RevealGroup>
    </>
  )
}
