'use client'

import { ArrowDownRight, ArrowUpRight, EyeOff, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type * as React from 'react'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { MoneyText } from '@/components/atoms/money-text'
import { cn } from '@/lib/cn'
import { formatarDataCurta, partesDaData } from '@/lib/data'
import type { CategoriaResumo, Lancamento } from '@/types/api'

// TransactionRow do Design System: o lançamento como card na lista do celular e do tablet (< 1024px).
// A linha inteira é o alvo: a descrição é um link "esticado" (::after cobre o card) com aria-label "Ver <descrição>".
// Estados: normal, fora do saldo (INATIVO: borda tracejada, ícone neutro, texto suave, selo "Fora do saldo") e na lixeira
// (DELETADO: selo "Na lixeira" e botão Restaurar por cima do link). Puro: dados e ações por props.

/** Chip neutro de categoria (a cor diferencia tipos, não instâncias) */
export function ChipCategoria({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      data-slot="chip-categoria"
      className={cn(
        'rounded-pilula bg-secondary text-foreground inline-flex min-h-[22px] max-w-[140px] items-center truncate px-2 text-xs leading-[18px] font-semibold',
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  )
}

/** Até `maximo` chips e "+N" com o resto (o nome inteiro de todas fica no `title` do +N e na visualização) */
export function ChipsDeCategorias({ categorias, maximo }: { categorias: CategoriaResumo[]; maximo?: number }) {
  const visiveis = maximo === undefined ? categorias : categorias.slice(0, maximo)
  const resto = categorias.slice(visiveis.length)
  return (
    <>
      {visiveis.map((categoria) => (
        <ChipCategoria key={categoria.id}>{categoria.descricao}</ChipCategoria>
      ))}
      {resto.length > 0 && (
        <span title={resto.map((c) => c.descricao).join(', ')}>
          <ChipCategoria>
            <span aria-hidden="true">+{resto.length}</span>
            <span className="sr-only">e mais {resto.length}</span>
          </ChipCategoria>
        </span>
      )}
    </>
  )
}

/** Selo "Fora do saldo" (INATIVO) ou "Na lixeira" (DELETADO); nada quando conta no saldo */
export function SeloStatus({ status }: { status: Lancamento['status'] }) {
  if (status === 'ATIVO') return null
  const lixeira = status === 'DELETADO'
  const Icone = lixeira ? Trash2 : EyeOff
  return (
    <Badge variant="contorno">
      <Icone aria-hidden="true" />
      {lixeira ? 'Na lixeira' : 'Fora do saldo'}
    </Badge>
  )
}

/** "18 nov" na lista do mês; "14 nov 2026" fora do filtro de mês (lixeira) */
export function dataDaLinha(iso: string, comAno = false) {
  return comAno ? `${formatarDataCurta(iso)} ${partesDaData(iso).ano}` : formatarDataCurta(iso)
}

export type TransactionRowProps = {
  lancamento: Lancamento
  /** Destino do link (visualização em tela cheia); no tablet/computador a tela intercepta com `onAbrir` */
  href: string
  onAbrir?: (lancamento: Lancamento, evento: React.MouseEvent<HTMLAnchorElement>) => void
  /** Data com o ano (Lixeira: todos os meses) */
  comAno?: boolean
  /** Na lixeira: botão Restaurar */
  onRestaurar?: (lancamento: Lancamento) => void
  restaurando?: boolean
  /** Sem internet: Restaurar fica desabilitado com o motivo (id do texto) */
  motivoDesabilitado?: string
}

export function TransactionRow({
  lancamento,
  href,
  onAbrir,
  comAno = false,
  onRestaurar,
  restaurando = false,
  motivoDesabilitado,
}: TransactionRowProps) {
  const { descricao, tipo, data, valor, status, categorias } = lancamento
  const esmaecido = status !== 'ATIVO'
  const funcao = esmaecido ? 'neutro' : tipo === 'RECEITA' ? 'receita' : 'despesa'

  return (
    <div
      data-slot="transaction-row"
      data-status={status}
      className={cn(
        'rounded-card border-border bg-card text-foreground hover:bg-secondary relative grid min-h-18 w-full grid-cols-[40px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border px-4 py-3 transition-colors',
        esmaecido && 'border-input border-dashed bg-transparent',
      )}
    >
      <FunctionIcon
        funcao={funcao}
        icone={tipo === 'RECEITA' ? ArrowUpRight : ArrowDownRight}
        className={cn(esmaecido && 'text-muted-foreground')}
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <Link
            href={href}
            aria-label={`Ver ${descricao}`}
            onClick={onAbrir ? (evento) => onAbrir(lancamento, evento) : undefined}
            className={cn(
              'line-clamp-2 min-w-0 flex-1 text-[15px] leading-[22px] font-bold [overflow-wrap:anywhere] text-inherit no-underline',
              'after:rounded-card outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--ring)]',
              esmaecido && 'text-muted-foreground',
            )}
          >
            {descricao}
          </Link>
          <MoneyText valor={valor} tipo={tipo} suave={esmaecido} anunciarTipo className="pt-px [&>svg]:hidden" />
        </span>
        <span className="text-legenda text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
          <time dateTime={data}>{dataDaLinha(data, comAno)}</time>
          <ChipsDeCategorias categorias={categorias} maximo={2} />
          <SeloStatus status={status} />
        </span>
      </span>
      {onRestaurar && (
        <Button
          variant="contornado"
          size="pequeno"
          loading={restaurando}
          aria-label={`Restaurar ${descricao}`}
          aria-disabled={motivoDesabilitado ? true : undefined}
          aria-describedby={motivoDesabilitado}
          onClick={() => {
            if (!motivoDesabilitado) onRestaurar(lancamento)
          }}
          className="relative z-[1] col-start-2 min-h-11 justify-self-start"
        >
          {!restaurando && <RotateCcw aria-hidden="true" />}
          Restaurar
        </Button>
      )}
    </div>
  )
}

export type TransactionRowListProps = Omit<React.ComponentProps<'ul'>, 'children'> & {
  children: React.ReactNode
}

/** Lista de cards (8px entre eles), da data mais recente para a mais antiga */
export function TransactionRowList({ className, children, ...props }: TransactionRowListProps) {
  return (
    <ul data-slot="transaction-row-list" className={cn('m-0 flex list-none flex-col gap-2 p-0', className)} {...props}>
      {children}
    </ul>
  )
}
