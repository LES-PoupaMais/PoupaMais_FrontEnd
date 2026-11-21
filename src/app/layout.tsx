import type { Metadata, Viewport } from 'next'
import { AppProviders } from '@/screens/App'
import { plusJakarta } from '@/styles/fonts'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'PoupaMais',
  description: 'Controle financeiro pessoal: receitas, despesas e a saúde financeira do mês.',
  applicationName: 'PoupaMais',
  // PWA no iPhone/iPad (o manifest vem de app/manifest.ts; o ícone, de app/apple-icon.png)
  appleWebApp: { capable: true, title: 'PoupaMais', statusBarStyle: 'default' },
}

// Cor da barra do navegador/app instalado: o `fundo` do Design System em cada tema
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F6F8' },
    { media: '(prefers-color-scheme: dark)', color: '#111A2F' },
  ],
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
