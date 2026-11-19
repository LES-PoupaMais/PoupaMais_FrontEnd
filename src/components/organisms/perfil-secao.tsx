import { ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useId, type ReactNode } from 'react'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { cn } from '@/lib/cn'

// Blocos do Perfil (pranchetas perfil-*): card do DS com título `titulo-3` e o ícone de função neutro ao lado,
// e a linha de ação das seções "Seus lançamentos" e "Privacidade" (ícone + nome + legenda + chevron, 56px de altura).

export type PerfilSecaoProps = {
  titulo: string
  icone: LucideIcon
  children: ReactNode
  className?: string
}

/** Card de uma seção do Perfil, rotulado pelo próprio título (`aria-labelledby`). */
export function PerfilSecao({ titulo, icone, children, className }: PerfilSecaoProps) {
  const idTitulo = useId()
  return (
    <section
      aria-labelledby={idTitulo}
      className={cn(
        'rounded-card border-border bg-card text-card-foreground shadow-card flex flex-col gap-4 border p-5',
        className,
      )}
    >
      <h2 id={idTitulo} className="text-titulo-3 flex items-center gap-3">
        <FunctionIcon icone={icone} />
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export type LinhaDeAcaoProps = {
  titulo: string
  /** Legenda abaixo do título (some enquanto carrega, se `legenda` for undefined) */
  legenda?: ReactNode
  icone: LucideIcon
  /** Link (navega) ou botão (`onClick`) */
  href?: string
  onClick?: () => void
  /** Ação de exclusão: título e ícone em `erro` */
  perigo?: boolean
  disabled?: boolean
  'aria-describedby'?: string
}

/** Linha de ação das listas do Perfil. As linhas ficam separadas por borda (use dentro de `ListaDeAcoes`). */
export function LinhaDeAcao({
  titulo,
  legenda,
  icone,
  href,
  onClick,
  perigo = false,
  disabled = false,
  'aria-describedby': descricao,
}: LinhaDeAcaoProps) {
  const classe = cn(
    'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-45',
    perigo ? 'text-destructive' : 'text-foreground',
  )
  const conteudo = (
    <>
      <FunctionIcon icone={icone} className={cn(perigo && 'bg-erro-fundo text-destructive')} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-corpo-forte">{titulo}</span>
        {legenda !== undefined && <span className="text-legenda text-muted-foreground">{legenda}</span>}
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </>
  )
  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-describedby={descricao} className={classe}>
      {conteudo}
    </button>
  )
}

/** Lista de linhas de ação separadas por uma borda fina. */
export function ListaDeAcoes({ children }: { children: ReactNode }) {
  return <div className="divide-border flex flex-col divide-y">{children}</div>
}
