import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'
import { buttonVariants } from '@/components/atoms/button'
import { RodapePublico } from './auth-template'

// Páginas públicas (landing, política de privacidade, 404). Seguem o tema (claro ou escuro).
// Topo com o logo, "Entrar" e "Criar conta"; rodapé com a página inicial e a política de privacidade.
// Pranchetas: ../Documentação/design/telas/project/landing-*.dc.html e privacidade-*.dc.html.
export type PublicTemplateProps = {
  children: ReactNode
}

export function PublicTemplate({ children }: PublicTemplateProps) {
  return (
    <div data-slot="public-template" className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="max-w-conteudo mx-auto flex w-full items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" aria-label="PoupaMais, ir para a página inicial">
          <Logo className="h-12" />
        </Link>
        <nav aria-label="Acesso" className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'xl' })}>
            Entrar
          </Link>
          <Link href="/cadastro" className={buttonVariants({ variant: 'outline', size: 'xl' })}>
            Criar conta
          </Link>
        </nav>
      </header>
      <main className="max-w-conteudo mx-auto flex w-full flex-1 flex-col px-5 md:px-8">{children}</main>
      <RodapePublico />
    </div>
  )
}
