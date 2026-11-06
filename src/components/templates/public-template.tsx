import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// Esqueleto das páginas públicas (landing, política de privacidade): tema escuro do protótipo.
export function PublicTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="dark bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4 md:px-10">
        <Link href="/" className="font-heading flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="text-marca size-5" aria-hidden="true" />
          PoupaMais
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
            Entrar
          </Link>
          <Link href="/cadastro" className={cn(buttonVariants({ variant: 'success' }), 'font-semibold')}>
            Criar conta
          </Link>
        </nav>
      </header>
      {children}
    </div>
  )
}
