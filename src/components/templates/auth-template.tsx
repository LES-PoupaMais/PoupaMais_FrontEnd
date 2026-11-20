import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'
import { cn } from '@/lib/cn'

// Telas de acesso (login, cadastro, esqueci e redefinir senha, sessão vencida). Seguem o tema (claro ou escuro).
// Pranchetas: login-computador (e as variantes -celular), cadastro-computador.
// - Celular (< 768px): sem cartão. Topo com o logo pequeno à esquerda (e `acaoCelular` à direita, ex.: "‹ Entrar" no
//   esqueci), título e campos alinhados à esquerda, rodapé só com a "Política de privacidade". `cartaoNoCelular` mantém
//   o cartão com o conteúdo centralizado (link expirado, que na prancheta é um ErrorState em cartão).
// - Tablet e computador: cartão central com o logo grande, título e subtítulo centralizados; rodapé com a página
//   inicial, a política e o ©.
// - Com `lateral` (cadastro), a partir de 1024px: texto de apoio à esquerda do cartão, topo da página com o logo e
//   `acaoComputador` ("Já tenho conta") e o cartão sem o logo, com o título alinhado à esquerda.
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
  /** Opcional: ação no topo, à direita do logo, só no celular ("‹ Entrar" no esqueci) */
  acaoCelular?: ReactNode
  /** Opcional: ação no topo, à direita do logo, a partir de 1024px; só com `lateral` ("Já tenho conta" no cadastro) */
  acaoComputador?: ReactNode
  /** Opcional: subtítulo no lugar de `subtitulo` a partir de 1024px, quando há `lateral` ("Só nome, e-mail e senha.") */
  subtituloComLateral?: ReactNode
  /** Mantém o cartão (com o conteúdo centralizado) também no celular */
  cartaoNoCelular?: boolean
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
  acaoCelular,
  acaoComputador,
  cartaoNoCelular = false,
}: AuthTemplateProps) {
  const comLateral = Boolean(lateral)
  // Classes do cartão: no celular só aparecem com `cartaoNoCelular`; a partir de 768px, sempre
  const cartao = cartaoNoCelular
    ? 'bg-card text-card-foreground border-border rounded-grande shadow-card border px-5 py-8'
    : 'md:bg-card md:text-card-foreground md:border-border md:rounded-grande md:shadow-card md:border md:py-8'
  const centro = cartaoNoCelular ? 'text-center' : 'text-left md:text-center'

  const card = (
    <div
      data-slot="auth-cartao"
      className={cn(
        'flex w-full flex-col gap-6 md:max-w-[440px] md:px-10',
        cartao,
        comLateral && 'lg:max-w-[480px] lg:gap-5 lg:p-8',
      )}
    >
      <Link href="/" aria-label={ROTULO_LOGO} className={cn('hidden self-center md:flex', comLateral && 'lg:hidden')}>
        <Logo className="h-[72px]" />
      </Link>
      {aviso}
      <div className={cn('flex flex-col gap-2', centro, comLateral && 'lg:text-left')}>
        {icone && (
          <span
            aria-hidden="true"
            className={cn(
              'rounded-card mb-2 grid size-14 place-items-center',
              cartaoNoCelular ? 'self-center' : 'self-start md:self-center',
              comLateral && 'lg:self-start',
              TONS_DO_ICONE[icone.tom],
            )}
          >
            <icone.Icone className="size-6" strokeWidth={2} />
          </span>
        )}
        {/* No cartão do celular, título do ErrorState (titulo-2), como na prancheta redefinir-expirado-celular */}
        <h1 className={cn('text-titulo-1', cartaoNoCelular && 'max-md:text-titulo-2')}>{titulo}</h1>
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
      <header className={cn('px-5 pt-3 md:hidden', comLateral && 'lg:block lg:px-8 lg:pt-4')}>
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-2">
          <Link href="/" aria-label={ROTULO_LOGO} className="inline-flex min-h-11 items-center">
            <Logo moldura className={cn('h-11', comLateral && 'lg:h-13')} />
          </Link>
          {acaoCelular && <div className="md:hidden">{acaoCelular}</div>}
          {comLateral && acaoComputador && <div className="hidden lg:block">{acaoComputador}</div>}
        </div>
      </header>
      <main
        className={cn(
          'flex flex-1 flex-col px-5 py-6 md:grid md:place-items-center md:px-8 md:pt-12',
          comLateral && 'lg:pt-6',
        )}
      >
        {lateral ? (
          <div className="flex w-full justify-center lg:grid lg:max-w-[1040px] lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:gap-18">
            <div className="hidden lg:flex lg:flex-col lg:gap-6">{lateral}</div>
            {card}
          </div>
        ) : (
          card
        )}
      </main>
      <RodapePublico compactoNoCelular />
    </div>
  )
}

const LINK_RODAPE = 'text-primary hover:text-primaria-hover inline-flex min-h-11 items-center font-bold underline'

/**
 * Rodapé das telas de acesso e das páginas públicas simples (404): página inicial, política de privacidade e ©.
 * `compactoNoCelular` (telas de acesso): abaixo de 768px fica só a política, como nas pranchetas -celular.
 */
export function RodapePublico({ compactoNoCelular = false }: { compactoNoCelular?: boolean }) {
  const soNoTablet = compactoNoCelular && 'hidden md:inline-flex'
  return (
    <footer className="text-legenda flex flex-wrap justify-center gap-6 px-5 pt-4 pb-6 md:px-8">
      <Link href="/" className={cn(LINK_RODAPE, soNoTablet)}>
        Página inicial
      </Link>
      <Link href="/privacidade" className={LINK_RODAPE}>
        Política de privacidade
      </Link>
      <span className={cn('text-muted-foreground inline-flex items-center', soNoTablet)}>© 2026 PoupaMais</span>
    </footer>
  )
}
