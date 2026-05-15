'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from '@/lib/locale/context'

// ─── Nav data ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: '1996',
    href: '/our-story',
    children: [
      { label: 'our story', href: '/our-story' },
      { label: 'leadership', href: '/leadership' },
      { label: "where we're going", href: '/where-were-going' },
    ],
  },
  {
    label: 'our engineers',
    href: '/our-engineers',
    children: [
      { label: 'who they are', href: '/our-engineers' },
      { label: 'why they stay', href: '/why-they-stay' },
      { label: 'how we find them', href: '/how-we-find-them' },
      { label: 'pakistan advantage', href: '/pakistan-advantage' },
    ],
  },
  {
    label: 'experience',
    href: '/client-stories',
    children: [
      { label: 'client stories', href: '/client-stories' },
      { label: 'by challenge type', href: '/by-challenge-type' },
      { label: 'the numbers', href: '/the-numbers' },
    ],
  },
  {
    label: 'engineering',
    href: '/software',
    children: [
      { label: 'software', href: '/software' },
      { label: 'firmware & embedded', href: '/firmware-embedded' },
      { label: 'hardware design', href: '/hardware-design' },
      { label: 'cloud & infrastructure', href: '/cloud-infrastructure' },
      { label: 'AI & Machine Learning', href: '/ai-machine-learning' },
    ],
  },
  {
    label: 'straight talk',
    href: '/straight-talk',
    children: [],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SiteHeaderProps {
  logo?: { url?: string | null; alt?: string | null } | null
  navigationItems?: unknown
  ctaButton?: unknown
  stickyHeader?: boolean | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteHeader(_props: SiteHeaderProps) {
  const locale = useLocale()
  const makeHref = (path: string) => locale.isDefault ? path : `/${locale.code}${path}`

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSection, setOpenSection] = useState<number | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function toggleSection(i: number) {
    setOpenSection(prev => (prev === i ? null : i))
  }

  function closeMobile() {
    setMobileOpen(false)
    setOpenSection(null)
  }

  return (
    <>
      <nav
        className={[
          'fixed inset-x-0 top-0 z-[100] flex items-center justify-between',
          'px-16 py-6 max-[900px]:px-8 max-[900px]:py-5',
          'bg-[rgba(250,250,248,0.92)] backdrop-blur-[20px]',
          'border-b transition-colors duration-300',
          scrolled ? 'border-nb-divider' : 'border-transparent',
        ].join(' ')}
      >
        {/* Logo */}
        <a href="/" className="flex items-center no-underline">
          <img
            src="https://nextbridge.com/wp-content/uploads/2025/01/NXB-Logo.svg"
            alt="Nextbridge"
            className="h-7 w-auto"
          />
        </a>

        {/* Desktop nav links */}
        <ul className="[@media(min-width:901px)]:flex hidden items-center gap-10 list-none m-0 p-0">
          {NAV_ITEMS.map((item, i) => (
            <li key={i} className="relative group">
              <a
                href={makeHref(item.href)}
                className="text-[0.85rem] font-normal text-nb-text-secondary no-underline tracking-[0.02em] transition-colors duration-200 hover:text-nb-text"
              >
                {item.label}
              </a>
              {item.children.length > 0 && (
                <ul
                  className={[
                    'absolute top-full left-[-1rem] hidden group-hover:block',
                    'min-w-[200px] list-none m-0 py-3',
                    'bg-[rgba(250,250,248,0.96)] backdrop-blur-[20px]',
                    'border border-nb-divider z-[200]',
                  ].join(' ')}
                >
                  {item.children.map((child, j) => (
                    <li key={j}>
                      <a
                        href={makeHref(child.href)}
                        className="block px-5 py-2 text-[0.8rem] text-nb-text-secondary no-underline whitespace-nowrap transition-colors duration-200 hover:text-nb-text hover:bg-black/[0.03]"
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          <li>
            <a
              href={makeHref('/start-a-conversation')}
              className="text-[0.85rem] font-medium text-nb-text no-underline tracking-[0.02em] px-5 py-2 border border-nb-text transition-colors duration-200 hover:bg-nb-text hover:text-nb-bg"
            >
              start a conversation
            </a>
          </li>
        </ul>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          className="[@media(min-width:901px)]:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2 z-[300] relative"
          aria-label="Menu"
        >
          <span
            className={[
              'block w-[22px] h-[1.5px] bg-nb-text transition-transform duration-300',
              mobileOpen ? 'translate-y-[6.5px] rotate-45' : '',
            ].join(' ')}
          />
          <span
            className={[
              'block w-[22px] h-[1.5px] bg-nb-text transition-opacity duration-300',
              mobileOpen ? 'opacity-0' : '',
            ].join(' ')}
          />
          <span
            className={[
              'block w-[22px] h-[1.5px] bg-nb-text transition-transform duration-300',
              mobileOpen ? '-translate-y-[6.5px] -rotate-45' : '',
            ].join(' ')}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={[
          'fixed inset-0 z-[250] bg-nb-bg overflow-y-auto px-8 pt-[5.5rem] pb-12',
          'transition-all duration-300',
          mobileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none',
        ].join(' ')}
      >
        <div className="max-w-[400px]">
          {NAV_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-nb-divider">
              {item.children.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleSection(i)}
                    className="w-full flex items-center justify-between py-5 font-heading text-[0.85rem] font-normal tracking-[0.02em] text-nb-text bg-transparent border-none cursor-pointer text-left"
                  >
                    {item.label}
                    <span className="font-sans text-[1.1rem] font-light text-nb-text-secondary">
                      {openSection === i ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-[max-height] duration-300"
                    style={{ maxHeight: openSection === i ? '400px' : '0' }}
                  >
                    {item.children.map((child, j) => (
                      <a
                        key={j}
                        href={makeHref(child.href)}
                        onClick={closeMobile}
                        className={[
                          'block py-[0.65rem] pl-3 ml-1 text-[0.82rem] text-nb-text-secondary no-underline',
                          'border-l border-nb-divider transition-colors duration-200',
                          'hover:text-nb-text hover:border-l-nb-highlight',
                          j === item.children.length - 1 ? 'mb-4' : '',
                        ].join(' ')}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <a
                  href={makeHref(item.href)}
                  onClick={closeMobile}
                  className="block py-5 font-heading text-[0.85rem] font-normal tracking-[0.02em] text-nb-text no-underline"
                >
                  {item.label}
                </a>
              )}
            </div>
          ))}

          <div className="pt-6">
            <a
              href={makeHref('/start-a-conversation')}
              onClick={closeMobile}
              className="inline-block font-heading text-[0.75rem] font-normal tracking-[0.02em] text-nb-text no-underline px-6 py-3 border border-nb-text transition-colors duration-200 hover:bg-nb-text hover:text-nb-bg"
            >
              start a conversation
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
