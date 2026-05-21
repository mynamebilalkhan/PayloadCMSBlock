import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavigationLink { label: string; url: string }
export interface SocialLink { platform?: string | null; url?: string | null }

export interface SiteFooterProps {
  logo?: { url?: string | null; alt?: string | null } | null
  navigation?: NavigationLink[] | null
  copyright?: string | null
  socialLinks?: SocialLink[] | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteFooter({ navigation, copyright }: SiteFooterProps) {
  const defaultLinks: NavigationLink[] = [
    { label: 'Careers', url: '/careers' },
    { label: 'Nextbridge Motorsports', url: '/motorsports' },
    { label: 'Privacy', url: '/privacy' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/company/nextbridge/' },
  ]

  const links = navigation && navigation.length > 0 ? navigation : defaultLinks
  const copyrightText = copyright || '© 2026 NEXTBRIDGE LIMITED. All rights reserved.'

  return (
    <footer className="flex items-center justify-between px-16 py-10 border-t border-nb-divider max-[900px]:flex-col max-[900px]:gap-5 max-[900px]:text-center max-[900px]:px-8">
      <div className="flex flex-col gap-1">
        <div className="text-[0.78rem] font-normal text-nb-text-secondary">
          {copyrightText}
        </div>
        {/* <div className="text-[0.65rem] font-normal tracking-[0.08em] text-[#B0AEA6]">v1.09</div> */}
      </div>
      <ul className="flex gap-8 list-none m-0 p-0">
        {links.map((link, i) => {
          const isExternal = link.url.startsWith('http')
          return (
            <li key={i}>
              <a
                href={link.url}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-[0.78rem] font-normal text-nb-text-secondary no-underline transition-colors duration-200 hover:text-nb-text"
              >
                {link.label}
              </a>
            </li>
          )
        })}
      </ul>
    </footer>
  )
}
