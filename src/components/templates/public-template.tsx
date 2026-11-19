import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'
import { buttonVariants } from '@/components/atoms/button'
import { cn } from '@/lib/cn'
import { RodapePublico } from './auth-template'

// Páginas públicas (landing, política de privacidade, 404). Seguem o tema (claro ou escuro).
// Topo com o logo, "Entrar" e "Criar conta"; rodapé com a página inicial e a política de privacidade.
// Pranchetas: ../Documentação/design/telas/project/landing-*.dc.html e privacidade-*.dc.html.
//
// Props opcionais (todas aditivas; sem elas, o template é o de sempre):
// - `variante="site"` (landing e privacidade): topo em `superficie` com borda, conteúdo em largura total (cada seção põe a
//   sua faixa com `max-w-conteudo`) e o rodapé completo do site (logo, frase, links e ©);
// - `acoes`: troca os botões do topo (`null` = sem botões, como no 404);
// - `rodape`: troca o rodapé (`null` = sem rodapé);
// - `hrefLogo`: destino do logo (404 logado → Dashboard).
export type PublicTemplateProps = {
  children: ReactNode
  variante?: 'padrao' | 'site'
  acoes?: ReactNode
  rodape?: ReactNode
  hrefLogo?: string
}

export function PublicTemplate({ children, variante = 'padrao', acoes, rodape, hrefLogo = '/' }: PublicTemplateProps) {
  const site = variante === 'site'
  const acoesPadrao = (
    <>
      <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'xl' })}>
        Entrar
      </Link>
      <Link href="/cadastro" className={buttonVariants({ variant: 'outline', size: 'xl' })}>
        Criar conta
      </Link>
    </>
  )
  const botoes = acoes === undefined ? acoesPadrao : acoes
  const cabecalho = (
    <div
      className={cn(
        'max-w-conteudo mx-auto flex w-full items-center justify-between gap-4 px-5 py-4 md:px-8',
        site && 'min-h-19 py-2 md:py-2',
      )}
    >
      <Link href={hrefLogo} aria-label="PoupaMais, ir para a página inicial">
        <Logo className="h-12" />
      </Link>
      {botoes && (
        <nav aria-label="Acesso" className="flex items-center gap-2">
          {botoes}
        </nav>
      )}
    </div>
  )

  return (
    <div data-slot="public-template" className="bg-background text-foreground flex min-h-screen flex-col">
      <header className={cn(site && 'bg-card border-border border-b')}>{cabecalho}</header>
      <main className={cn('flex w-full flex-1 flex-col', !site && 'max-w-conteudo mx-auto px-5 md:px-8')}>
        {children}
      </main>
      {rodape === undefined ? site ? <RodapeSite /> : <RodapePublico /> : rodape}
    </div>
  )
}

/** Rodapé completo do site (landing-*, privacidade-*): logo, frase, links e ©. */
export function RodapeSite() {
  const link = 'text-corpo-forte text-primary inline-flex min-h-11 items-center'
  return (
    <footer className="bg-card border-border border-t">
      <div className="max-w-conteudo mx-auto flex flex-col gap-3 px-5 py-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            aria-label="PoupaMais, voltar ao topo da página inicial"
            className="inline-flex min-h-11 items-center"
          >
            <Logo className="h-12" />
          </Link>
          <p className="text-legenda text-muted-foreground">
            Finanças pessoais e familiares, mês a mês. Letramento financeiro para o dia a dia.
          </p>
        </div>
        <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-5 md:gap-x-6">
          <Link href="/privacidade" className={link}>
            Política de privacidade
          </Link>
          <Link href="/login" className={link}>
            Entrar
          </Link>
          <Link href="/cadastro" className={link}>
            Criar conta
          </Link>
        </nav>
        <p className="text-legenda text-muted-foreground md:w-full">© 2026 PoupaMais</p>
      </div>
    </footer>
  )
}
