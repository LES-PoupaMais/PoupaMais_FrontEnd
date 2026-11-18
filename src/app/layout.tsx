import type { Metadata } from 'next'
import { AppProviders } from '@/screens/App'
import { plusJakarta } from '@/styles/fonts'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'PoupaMais',
  description: 'Controle financeiro pessoal: receitas, despesas e a saúde financeira do mês.',
}

// suppressHydrationWarning: o next-themes põe a classe do tema no <html> antes da hidratação.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`h-full ${plusJakarta.variable}`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
