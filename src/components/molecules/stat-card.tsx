import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { Skeleton } from '@/components/atoms/skeleton'
import { cn } from '@/lib/cn'

// StatCard do Design System: tile do Início (Receitas, Despesas, Taxa de gasto) com ícone de função, rótulo e número.
// Uma cor de função por card: a cor fica só no ícone; o número usa a cor do texto, sem sinal nem seta (o rótulo diz o que é).
// O valor encolhe até 15px em tiles estreitos e nunca corta centavos.

const CARTAO = 'rounded-card border border-border bg-card text-card-foreground shadow-card'

type StatCardProps = Omit<React.ComponentProps<'article'>, 'children'> & {
  funcao?: 'receita' | 'despesa' | 'neutro'
  icone?: LucideIcon
  rotulo: string
  /** Valor já formatado ("R$ 12.480,50", "60,6%"). `null` = indisponível: "—" e "Não disponível para o período" */
  valor?: React.ReactNode | null
  /** Rodapé opcional: um Badge (faixa da taxa) ou texto curto */
  rodape?: React.ReactNode
  /** Mostra o esqueleto com as mesmas medidas */
  carregando?: boolean
}

function StatCard({
  funcao = 'neutro',
  icone,
  rotulo,
  valor,
  rodape,
  carregando = false,
  className,
  ...props
}: StatCardProps) {
  const classe = cn(CARTAO, '@container flex min-w-0 flex-col gap-3 p-4', className)

  if (carregando) {
    return (
      <article data-slot="stat-card" role="listitem" aria-hidden="true" className={classe} {...props}>
        <Skeleton forma="icone" />
        <Skeleton forma="texto" className="w-3/5" />
        <Skeleton forma="titulo" className="w-4/5" />
      </article>
    )
  }

  const indisponivel = valor === null || valor === undefined

  return (
    <article data-slot="stat-card" role="listitem" className={classe} {...props}>
      <FunctionIcon funcao={funcao} icone={icone} />
      <div>
        <p className="text-rotulo-campo text-muted-foreground">{rotulo}</p>
        <p
          className={cn(
            'text-[clamp(15px,13cqi,22px)] leading-7 font-extrabold whitespace-nowrap tabular-nums',
            indisponivel && 'text-muted-foreground',
          )}
        >
          {indisponivel ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Sem valor</span>
            </>
          ) : (
            valor
          )}
        </p>
      </div>
      {(rodape || indisponivel) && (
        <div className="text-legenda text-muted-foreground flex min-h-5 flex-wrap items-center gap-1">
          {rodape ?? 'Não disponível para o período'}
        </div>
      )}
    </article>
  )
}

type StatCardGradeProps = React.ComponentProps<'div'> & {
  /** Nome da grade para o leitor de tela, ex.: "Resumo de novembro de 2026" */
  'aria-label': string
  /** A partir de 1024px, 3 colunas (linha 1 do Dashboard no computador) */
  computador?: boolean
  /** Carregando: `aria-busy` e o aviso "Carregando o resumo do mês…" */
  carregando?: boolean
}

/** Grade de 2 colunas dos tiles (lista acessível). Um número ímpar de tiles deixa o último sozinho à esquerda. */
function StatCardGrade({ computador = false, carregando = false, className, children, ...props }: StatCardGradeProps) {
  return (
    <>
      {carregando && (
        <span role="status" className="sr-only">
          Carregando o resumo do mês…
        </span>
      )}
      <div
        data-slot="stat-card-grade"
        role="list"
        aria-busy={carregando || undefined}
        className={cn('grid grid-cols-2 gap-3', computador && 'lg:grid-cols-3', className)}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

export { StatCard, StatCardGrade }
export type { StatCardGradeProps, StatCardProps }
