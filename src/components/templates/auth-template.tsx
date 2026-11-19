import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'
import { cn } from '@/lib/cn'

// Telas de acesso (login, cadastro, esqueci e redefinir senha, sessão vencida). Seguem o tema (claro ou escuro):
// card central com o logo, título e subtítulo; rodapé com a página inicial e a política de privacidade.
// Prancheta de referência: ../Documentação/design/telas/project/login-computador.dc.html (e as variantes -celular).
// Tons do ícone opcional acima do título (esqueci, e-mail enviado, redefinir, link expirado)
const TONS_DO_ICONE = {
  primaria: 'bg-accent text-primary',
  receita: 'bg-receita-fundo text-receita',
  erro: 'bg-erro-fundo text-destructive',
} as const

export type AuthTemplateProps = {
  titulo: string
  subtitulo?: ReactNode
  /** Formulário e avisos da tela */
  children: ReactNode
  /** Abaixo do formulário, dentro do card: "Não tem conta? Criar conta" */
  rodape?: ReactNode
  /** Opcional: aviso acima do título (ActionBanner da sessão vencida) */
  aviso?: ReactNode
  /** Opcional: ícone de 56px acima do título */
  icone?: { Icone: LucideIcon; tom: keyof typeof TONS_DO_ICONE }
  /** Opcional: texto de apoio à esquerda do card a partir de 1024px (cadastro-computador); escondido abaixo disso */
  lateral?: ReactNode
}

export function AuthTemplate({ titulo, subtitulo, children, rodape, aviso, icone, lateral }: AuthTemplateProps) {
  const card = (
    <div
      className={cn(
        'bg-card text-card-foreground border-border rounded-grande shadow-card flex w-full max-w-[440px] flex-col gap-6 border px-6 py-8 sm:px-10',
        lateral && 'lg:max-w-[480px]',
      )}
    >
      <Link href="/" aria-label="PoupaMais, ir para a página inicial" className="self-center">
        <Logo className="h-[72px]" />
      </Link>
      {aviso}
      <div className="flex flex-col gap-2 text-center">
        {icone && (
          <span
            aria-hidden="true"
            className={cn('rounded-card mb-2 grid size-14 place-items-center self-center', TONS_DO_ICONE[icone.tom])}
          >
            <icone.Icone className="size-6" strokeWidth={2} />
          </span>
        )}
        <h1 className="text-titulo-1">{titulo}</h1>
        {subtitulo && <p className="text-corpo text-muted-foreground">{subtitulo}</p>}
      </div>
      {children}
      {rodape && <div className="text-corpo text-muted-foreground text-center">{rodape}</div>}
    </div>
  )

  return (
    <div data-slot="auth-template" className="bg-background text-foreground flex min-h-screen flex-col">
      <main className="grid flex-1 place-items-center px-5 pt-12 pb-6 md:px-8">
        {lateral ? (
          <div className="flex w-full justify-center lg:grid lg:max-w-[1040px] lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:gap-18">
            <div className="hidden lg:flex lg:flex-col lg:gap-6">{lateral}</div>
            {card}
          </div>
        ) : (
          card
        )}
      </main>
      <RodapePublico />
    </div>
  )
}

export function RodapePublico() {
  return (
    <footer className="text-legenda flex flex-wrap justify-center gap-6 px-5 pt-4 pb-6 md:px-8">
      <Link href="/" className="text-primary inline-flex min-h-11 items-center font-bold">
        Página inicial
      </Link>
      <Link href="/privacidade" className="text-primary inline-flex min-h-11 items-center font-bold">
        Política de privacidade
      </Link>
      <span className="text-muted-foreground inline-flex items-center">© 2026 PoupaMais</span>
    </footer>
  )
}
