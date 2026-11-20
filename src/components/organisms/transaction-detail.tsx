'use client'

import { ArrowDownRight, ArrowUpRight, FilePlus2, Pencil, RotateCcw, Trash2, TriangleAlert, X } from 'lucide-react'
import Link from 'next/link'
import { useId } from 'react'
import type * as React from 'react'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { MoneyText } from '@/components/atoms/money-text'
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/atoms/sheet'
import { Skeleton } from '@/components/atoms/skeleton'
import { Switch } from '@/components/atoms/switch'
import { Timeline, type ItemDaTimeline } from '@/components/molecules/timeline'
import { ChipsDeCategorias, SeloStatus } from '@/components/organisms/transaction-row'
import { cn } from '@/lib/cn'
import { formatarDataExtenso } from '@/lib/data'
import type { Lancamento } from '@/types/api'

// TransactionDetail do Design System: visualização só leitura do lançamento, com as ações Editar e Mover para a lixeira
// (na lixeira: aviso, selo "Na lixeira", valor suave, "Conta no saldo: Não" sem switch e a ação Restaurar).
// Dados em <dl>, data por extenso e a linha do tempo da auditoria (Timeline: criado, alterado, movido para a lixeira).
// `TransactionDetailPanel` é o painel à direita (~440px, véu) do tablet e do computador. Puro: dados e ações por props.

export const AVISO_LIXEIRA =
  'Este lançamento está na lixeira e não pode ser editado. Ele não aparece na lista nem conta no saldo. Restaure para poder editar.'

/** Eventos da auditoria, do mais recente para o mais antigo */
export function eventosDaAuditoria({ dataCadastro, dataAtualizacao, dataExclusao }: Lancamento): ItemDaTimeline[] {
  const eventos: ItemDaTimeline[] = [{ id: 'criado', icone: FilePlus2, titulo: 'Criado', quando: dataCadastro }]
  if (dataAtualizacao && dataAtualizacao !== dataCadastro)
    eventos.push({ id: 'alterado', icone: Pencil, titulo: 'Alterado', quando: dataAtualizacao })
  if (dataExclusao)
    eventos.push({ id: 'lixeira', icone: Trash2, titulo: 'Movido para a lixeira', quando: dataExclusao })
  return eventos.sort((a, b) => Date.parse(b.quando) - Date.parse(a.quando))
}

export type TransactionDetailProps = {
  lancamento: Lancamento
  /** h1 na tela cheia do celular; h2 dentro do painel */
  nivelTitulo?: 'h1' | 'h2'
  hrefEditar?: string
  onAlternarSaldo?: (contaNoSaldo: boolean) => void
  alterandoSaldo?: boolean
  onMoverParaLixeira?: () => void
  onRestaurar?: () => void
  restaurando?: boolean
  /** Sem internet: o que grava fica desabilitado, com o id do texto do motivo */
  motivoDesabilitado?: string
  /** Ação extra em texto embaixo (ex.: "Ver a lixeira") */
  acaoExtra?: React.ReactNode
  className?: string
}

export function TransactionDetail({
  lancamento,
  nivelTitulo: Titulo = 'h2',
  hrefEditar,
  onAlternarSaldo,
  alterandoSaldo = false,
  onMoverParaLixeira,
  onRestaurar,
  restaurando = false,
  motivoDesabilitado,
  acaoExtra,
  className,
}: TransactionDetailProps) {
  const base = useId()
  const idSaldo = `${base}-saldo`
  const idHistorico = `${base}-historico`
  const { descricao, tipo, data, valor, status, categorias } = lancamento
  const naLixeira = status === 'DELETADO'
  const desabilitado = Boolean(motivoDesabilitado)
  const funcao = naLixeira ? 'neutro' : tipo === 'RECEITA' ? 'receita' : 'despesa'

  return (
    <div data-slot="transaction-detail" className={cn('text-foreground flex flex-col gap-5', className)}>
      {naLixeira && (
        <p
          role="status"
          className="rounded-campo bg-atencao-fundo text-legenda text-atencao flex items-start gap-2 px-4 py-3 font-bold"
        >
          <TriangleAlert className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {AVISO_LIXEIRA}
        </p>
      )}
      <div className="flex items-start gap-3">
        <FunctionIcon
          funcao={funcao}
          icone={tipo === 'RECEITA' ? ArrowUpRight : ArrowDownRight}
          className={cn(naLixeira && 'text-muted-foreground')}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Titulo className="text-titulo-2 [overflow-wrap:anywhere]">{descricao}</Titulo>
          <span className="flex flex-wrap gap-2">
            <Badge variant={tipo === 'RECEITA' ? 'receita' : 'despesa'}>
              {tipo === 'RECEITA' ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
              {tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
            </Badge>
            {naLixeira && <SeloStatus status={status} />}
          </span>
        </div>
      </div>
      <p>
        <MoneyText
          valor={valor}
          tipo={tipo}
          suave={naLixeira}
          anunciarTipo
          className="text-[clamp(24px,9vw,30px)] leading-9 font-extrabold tracking-[-0.01em] [&>svg]:size-[0.7em]"
        />
      </p>
      <dl className="border-border grid grid-cols-1 border-t">
        <Item rotulo="Data">
          <time dateTime={data}>{formatarDataExtenso(data)}</time>
        </Item>
        <Item rotulo="Categorias">
          <ChipsDeCategorias categorias={categorias} />
        </Item>
        <Item rotulo="Conta no saldo" idRotulo={idSaldo}>
          {naLixeira ? (
            'Não · ao restaurar, volta como estava antes'
          ) : (
            <span className="inline-flex items-center gap-2">
              <Switch
                checked={status === 'ATIVO'}
                aria-labelledby={idSaldo}
                aria-busy={alterandoSaldo || undefined}
                disabled={alterandoSaldo || desabilitado}
                aria-describedby={motivoDesabilitado}
                onCheckedChange={(conta) => onAlternarSaldo?.(conta)}
              />
              <span aria-hidden="true">{status === 'ATIVO' ? 'Sim' : 'Não'}</span>
            </span>
          )}
        </Item>
      </dl>
      <section aria-labelledby={idHistorico} className="flex flex-col gap-3">
        <h3 id={idHistorico} className="text-rotulo-secao text-muted-foreground uppercase">
          Histórico<span className="sr-only">, do mais recente para o mais antigo</span>
        </h3>
        <Timeline itens={eventosDaAuditoria(lancamento)} aria-labelledby={idHistorico} />
      </section>
      <div className="flex flex-col gap-2 [&>*]:w-full">
        {naLixeira ? (
          onRestaurar && (
            <Button
              loading={restaurando}
              aria-disabled={desabilitado || undefined}
              aria-describedby={motivoDesabilitado}
              onClick={() => {
                if (!desabilitado) onRestaurar()
              }}
            >
              {!restaurando && <RotateCcw aria-hidden="true" />}
              Restaurar
            </Button>
          )
        ) : (
          <>
            {hrefEditar && (
              <Button asChild>
                <Link href={hrefEditar}>
                  <Pencil aria-hidden="true" />
                  Editar
                </Link>
              </Button>
            )}
            {onMoverParaLixeira && (
              <Button
                variant="perigo-texto"
                aria-disabled={desabilitado || undefined}
                aria-describedby={motivoDesabilitado}
                onClick={() => {
                  if (!desabilitado) onMoverParaLixeira()
                }}
              >
                <Trash2 aria-hidden="true" />
                Mover para a lixeira
              </Button>
            )}
          </>
        )}
        {acaoExtra}
      </div>
    </div>
  )
}

function Item({ rotulo, idRotulo, children }: { rotulo: string; idRotulo?: string; children: React.ReactNode }) {
  return (
    <div className="border-border flex min-h-14 flex-wrap items-center justify-between gap-3 border-b py-2">
      <dt id={idRotulo} className="text-rotulo-campo text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="text-corpo flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  )
}

/** Carregando: as mesmas formas do conteúdo */
export function TransactionDetailSkeleton() {
  return (
    <div data-slot="transaction-detail-skeleton" className="flex flex-col gap-5" aria-busy="true">
      <div className="flex items-start gap-3">
        <Skeleton forma="icone" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton forma="titulo" className="w-3/5" />
          <Skeleton forma="texto" className="w-20" />
        </div>
      </div>
      <Skeleton forma="valor" className="w-40" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </div>
  )
}

export type TransactionDetailPanelProps = {
  aberto: boolean
  onFechar: () => void
  children: React.ReactNode
}

/** Painel à direita, `min(440px, 100%)`, sobre a lista com o véu; Esc, véu e × fecham; o foco volta para a linha */
export function TransactionDetailPanel({ aberto, onFechar, children }: TransactionDetailPanelProps) {
  return (
    <Sheet open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        overlayClassName="bg-sobreposicao supports-backdrop-filter:backdrop-blur-none"
        className="bg-card text-foreground shadow-flutuante border-border w-[min(440px,100%)] gap-0 overflow-y-auto border-l p-0 sm:max-w-[440px]"
      >
        <div className="border-border flex min-h-15 items-center justify-between gap-2 border-b pr-2 pl-5">
          <SheetTitle className="text-titulo-3 font-bold">Lançamento</SheetTitle>
          <SheetClose
            aria-label="Fechar"
            className="rounded-pilula text-foreground hover:bg-secondary inline-grid size-11 place-items-center"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        </div>
        <div className="p-5">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
