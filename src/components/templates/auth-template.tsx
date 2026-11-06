import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Esqueleto das telas de autenticação (login, cadastro, esqueci/redefinir senha): card central no tema escuro.
export function AuthTemplate({ children, rodape }: { children: ReactNode; rodape?: ReactNode }) {
  return (
    <main className="dark bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="font-heading flex items-center gap-2 text-lg font-bold">
        <TrendingUp className="text-marca size-5" aria-hidden="true" />
        PoupaMais
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      {rodape && <div className="text-muted-foreground text-sm">{rodape}</div>}
    </main>
  )
}
