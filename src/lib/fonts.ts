import { DM_Sans, Michroma } from 'next/font/google'

/** NEXTBRIDGE brand body font — matches reference styles.css */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

/** NEXTBRIDGE brand heading font — matches reference styles.css */
export const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-michroma',
})
