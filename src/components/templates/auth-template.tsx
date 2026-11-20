import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'
import { cn } from '@/lib/cn'

// Telas de acesso (login, cadastro, esqueci e redefinir senha, sessão vencida). Seguem o tema (claro ou escuro):
// card central com o logo, título e subtítulo em todas as larguras (decisão de 20/11); rodapé com a página inicial,
// a política de privacidade e o ©. Prancheta de referência: ../Documentação/design/telas/project/login-computador.dc.html.
// Com `lateral` (cadastro-computador), a partir de 1024px: texto de apoio à esquerda do card, topo da página com o
// logo e `acaoComputador` ("Já tenho conta") e o card sem o logo, com o título alinhado à esquerda.
// Tons do ícone opcional acima do título (esqueci, e-mail enviado, redefinir, link expirado)
const TONS_DO_ICONE = {
  primaria: 'bg-accent text-primary',
  receita: 'bg-receita-fundo text-receita',
  erro: 'bg-erro-fundo text-destructive',
} as const

export type AuthTemplateProps = {
  titulo: string
  subtitulo?: ReactNode
  /** Opcional: subtítulo no lugar de `subtitulo` a partir de 1024px, quando há `lateral` ("Só nome, e-mail e senha.") */
  subtituloComLateral?: ReactNode
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
  /** Opcional, só com `lateral`: ação no topo da página, à direita do logo, a partir de 1024px ("Já tenho conta") */
  acaoComputador?: ReactNode
}

const ROTULO_LOGO = 'PoupaMais, ir para a página inicial'

export function AuthTemplate({
  titulo,
  subtitulo,
  subtituloComLateral,
  children,
  rodape,
  aviso,
  icone,
  lateral,
  acaoComputador,
}: AuthTemplateProps) {
  const comLateral = Boolean(lateral)
  const card = (
    <div
      className={cn(
        'bg-card text-card-foreground border-border rounded-grande shadow-card flex w-full max-w-[440px] flex-col gap-6 border px-6 py-8 sm:px-10',
        comLateral && 'lg:max-w-[480px] lg:gap-5 lg:p-8',
      )}
    >
      <Link href="/" aria-label={ROTULO_LOGO} className={cn('self-center', comLateral && 'lg:hidden')}>
        <Logo className="h-[72px]" />
      </Link>
      {aviso}
      <div className={cn('flex flex-col gap-2 text-center', comLateral && 'lg:text-left')}>
        {icone && (
          <span
            aria-hidden="true"
            className={cn(
              'rounded-card mb-2 grid size-14 place-items-center self-center',
              comLateral && 'lg:self-start',
              TONS_DO_ICONE[icone.tom],
            )}
          >
            <icone.Icone className="size-6" strokeWidth={2} />
          </span>
        )}
        <h1 className="text-titulo-1">{titulo}</h1>
        {subtitulo && (
          <p className={cn('text-corpo text-muted-foreground', comLateral && subtituloComLateral && 'lg:hidden')}>
            {subtitulo}
          </p>
        )}
        {comLateral && subtituloComLateral && (
          <p className="text-corpo text-muted-foreground hidden lg:block">{subtituloComLateral}</p>
        )}
      </div>
      {children}
      {rodape && <div className="text-corpo text-muted-foreground text-center">{rodape}</div>}
    </div>
  )

  return (
    <div data-slot="auth-template" className="bg-background text-foreground flex min-h-screen flex-col">
      {comLateral && (
        // Topo da prancheta cadastro-computador; abaixo de 1024px o logo fica no card
        <header className="hidden px-8 pt-4 lg:block">
          <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-2">
            <Link href="/" aria-label={ROTULO_LOGO} className="inline-flex min-h-11 items-center">
              <Logo moldura className="h-13" />
            </Link>
            {acaoComputador}
          </div>
        </header>
      )}
      <main className={cn('grid flex-1 place-items-center px-5 pt-12 pb-6 md:px-8', comLateral && 'lg:pt-6')}>
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

const LINK_RODAPE = 'text-primary hover:text-primaria-hover inline-flex min-h-11 items-center font-bold underline'

/** Rodapé das telas de acesso e das páginas públicas simples (404): página inicial, política de privacidade e ©. */
export function RodapePublico() {
  return (
    <footer className="text-legenda flex flex-wrap justify-center gap-6 px-5 pt-4 pb-6 md:px-8">
      <Link href="/" className={LINK_RODAPE}>
        Página inicial
      </Link>
      <Link href="/privacidade" className={LINK_RODAPE}>
        Política de privacidade
      </Link>
      <span className="text-muted-foreground inline-flex items-center">© 2026 PoupaMais</span>
    </footer>
  )
}
