'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { MoneyText } from '@/components/atoms/money-text'
import { cn } from '@/lib/cn'
import { formatarSaldo, somarValores, type ValorMonetario } from '@/lib/format'

// SubRowList do Design System: linha com sub-linhas que se abrem embaixo e somam o total do pai (base das divisões futuras).
// - o pai é um <button> com `aria-expanded` e `aria-controls`; segue o MoneyText (sinal, seta e cor do tipo);
// - sub-linhas recuadas, ligadas por um conector em L (borda), valores em cor de texto e sem sinal; fechadas ficam `hidden`;
// - "Soma das partes" confere com o total ("fecha com o total"); se não fechar, usa o texto de situação da ProgressBar.

type ParteDaLinha = { id?: string | number; nome: string; valor: ValorMonetario }

type SubRowProps = Omit<React.ComponentProps<'li'>, 'children'> & {
  nome: string
  /** Linha secundária ("10 nov · 3 itens") */
  meta?: string
  valor: ValorMonetario
  tipo: 'RECEITA' | 'DESPESA'
  /** Ícone do quadrado (padrão: seta do tipo) */
  icone?: LucideIcon
  filhos: readonly ParteDaLinha[]
  /** Começa aberto */
  abertoInicial?: boolean
  /** Mostra a linha "Soma das partes" quando aberto */
  mostrarSoma?: boolean
}

function textoDaSoma(soma: number, total: number): string {
  const diferenca = somarValores([total, -soma])
  if (diferenca === 0) return `${formatarSaldo(soma)} · fecha com o total`
  if (diferenca > 0) return `${formatarSaldo(soma)} · faltam ${formatarSaldo(diferenca)}`
  return `${formatarSaldo(soma)} · passou ${formatarSaldo(-diferenca)} do total`
}

function SubRow({
  nome,
  meta,
  valor,
  tipo,
  icone,
  filhos,
  abertoInicial = false,
  mostrarSoma = false,
  className,
  ...props
}: SubRowProps) {
  const [aberto, setAberto] = React.useState(abertoInicial)
  const idFilhos = React.useId()
  const soma = somarValores(filhos.map((f) => f.valor))
  const total = Math.abs(Number(valor))

  return (
    <li
      data-slot="sub-row"
      className={cn('rounded-card border-border bg-card text-card-foreground overflow-hidden border', className)}
      {...props}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idFilhos}
        onClick={() => setAberto((a) => !a)}
        className="hover:bg-secondary grid min-h-16 w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto_24px] items-center gap-3 px-4 py-3 text-left"
      >
        <FunctionIcon funcao={tipo === 'RECEITA' ? 'receita' : 'despesa'} icone={icone} />
        <span className="flex min-w-0 flex-col">
          <span className="line-clamp-2 font-bold">{nome}</span>
          {meta && <span className="text-legenda text-muted-foreground">{meta}</span>}
        </span>
        <MoneyText valor={valor} tipo={tipo} anunciarTipo />
        <ChevronRight
          className={cn('text-muted-foreground size-5 transition-transform', aberto && 'rotate-90')}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      <ul id={idFilhos} hidden={!aberto} className="m-0 list-none pr-4 pb-2 pl-[calc(1rem+19px)]">
        {filhos.map((filho) => (
          <li
            key={filho.id ?? filho.nome}
            className={cn(
              'text-corpo relative flex min-h-11 items-center justify-between gap-3 pl-[calc(1rem+14px)]',
              'before:border-border before:absolute before:-top-0.5 before:bottom-1/2 before:left-0 before:w-3.5 before:rounded-bl-lg before:border-b-2 before:border-l-2',
              'not-last:after:border-border not-last:after:absolute not-last:after:top-1/2 not-last:after:-bottom-0.5 not-last:after:left-0 not-last:after:border-l-2',
            )}
          >
            <span className="min-w-0 truncate">{filho.nome}</span>
            <MoneyText valor={filho.valor} className="text-corpo font-semibold" />
          </li>
        ))}
      </ul>
      {mostrarSoma && (
        <p
          hidden={!aberto}
          className="border-border text-legenda text-muted-foreground mr-4 ml-[calc(1rem+19px)] flex flex-wrap justify-between gap-3 border-t pt-2 pb-3 tabular-nums"
        >
          <span>Soma das partes</span>
          <span>{textoDaSoma(soma, total)}</span>
        </p>
      )}
    </li>
  )
}

/** Lista de SubRow */
function SubRowList({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot="sub-row-list" className={cn('m-0 flex list-none flex-col gap-2 p-0', className)} {...props} />
}

export { SubRow, SubRowList }
export type { ParteDaLinha, SubRowProps }
