import React from 'react'

// ─── Types (kept for compatibility with locale layout) ────────────────────────

export interface FooterLink { label: string; url: string }
export interface FooterColumn { title?: string | null; links?: FooterLink[] | null }
export interface SocialLink { platform?: string | null; url?: string | null }

export interface SiteFooterProps {
  logo?: { url?: string | null; alt?: string | null } | null
  columns?: FooterColumn[] | null
  copyright?: string | null
  socialLinks?: SocialLink[] | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteFooter(_props: SiteFooterProps) {
  return (
    <footer className="flex items-center justify-between px-16 py-10 border-t border-nb-divider max-[900px]:flex-col max-[900px]:gap-5 max-[900px]:text-center max-[900px]:px-8">
      <div className="flex flex-col gap-1">
        <div className="text-[0.78rem] font-normal text-nb-text-secondary">
          &copy; 2026 NEXTBRIDGE LIMITED. All rights reserved.
        </div>
        {/* <div className="text-[0.65rem] font-normal tracking-[0.08em] text-[#B0AEA6]">v1.09</div> */}
      </div>
      <ul className="flex gap-8 list-none m-0 p-0">
        {[
          { label: 'Careers', href: '/careers' },
          { label: 'Nextbridge Motorsports', href: '/motorsports' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'LinkedIn', href: 'https://www.linkedin.com/company/nextbridge/', external: true },
        ].map((link, i) => (
          <li key={i}>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="text-[0.78rem] font-normal text-nb-text-secondary no-underline transition-colors duration-200 hover:text-nb-text"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}
