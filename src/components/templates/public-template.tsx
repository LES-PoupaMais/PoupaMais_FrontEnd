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
      {/* cn: o buttonVariants sozinho não junta as classes (a borda do contornado perdia para a transparente) */}
      <Link href="/login" className={cn(buttonVariants({ variant: 'texto' }), 'px-2 sm:px-3')}>
        Entrar
      </Link>
      <Link href="/cadastro" className={cn(buttonVariants({ variant: 'contornado' }), 'px-4 sm:px-6')}>
        Criar conta
      </Link>
    </>
  )
  const botoes = acoes === undefined ? acoesPadrao : acoes
  const cabecalho = (
    <div
      className={cn(
        'max-w-conteudo mx-auto flex w-full items-center justify-between gap-3 py-4 pr-3 pl-5 sm:gap-4 md:px-8',
        site && 'min-h-16 py-2 md:min-h-19',
      )}
    >
      <Link href={hrefLogo} aria-label="PoupaMais, ir para a página inicial" className="inline-flex shrink-0">
        <Logo moldura className="h-12 md:h-14" />
      </Link>
      {botoes && (
        <nav aria-label="Acesso" className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
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
      {/* Celular: uma coluna (logo, frase, links, ©). A partir de 768px, uma linha só: logo e frase (com o ©) à
          esquerda, links à direita (prancheta landing-computador). */}
      <div className="max-w-conteudo mx-auto flex flex-col gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-8">
        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href="/"
            aria-label="PoupaMais, voltar ao topo da página inicial"
            className="inline-flex min-h-11 items-center self-start"
          >
            <Logo moldura className="h-12" />
          </Link>
          <p className="text-legenda text-muted-foreground">
            Finanças pessoais e familiares, mês a mês. Letramento financeiro para o dia a dia.
            <span className="hidden md:inline"> © 2026 PoupaMais</span>
          </p>
        </div>
        <nav aria-label="Links do rodapé" className="flex shrink-0 flex-wrap gap-x-5 md:gap-x-6">
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
        <p className="text-legenda text-muted-foreground md:hidden">© 2026 PoupaMais</p>
      </div>
    </footer>
  )
}
