import { Plus_Jakarta_Sans } from 'next/font/google'

// Fonte única do Design System, pesos 500 a 800. O globals.css lê a variável em --font-sans.
export const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})
