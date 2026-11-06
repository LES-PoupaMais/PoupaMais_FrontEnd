import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Esqueleto da área logada: navbar escura + conteúdo claro (tema padrão).
// A navbar completa (links, avatar e menu do usuário) vira o organismo Navbar no card de telas.
export function AppTemplate({ children, navbar }: { children: ReactNode; navbar?: ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-6">
          <Link href="/dashboard" className="font-heading flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="text-sidebar-primary size-5" aria-hidden="true" />
            PoupaMais
          </Link>
          {navbar}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
