'use client'

import { Info, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useId } from 'react'
import type * as React from 'react'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { MoneyText } from '@/components/atoms/money-text'
import { Switch } from '@/components/atoms/switch'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table'
import { ChipsDeCategorias } from '@/components/organisms/transaction-row'
import { cn } from '@/lib/cn'
import { formatarData } from '@/lib/data'
import type { Lancamento } from '@/types/api'

// TransactionTable do Design System: lançamentos no computador (≥ 1024px). A descrição é um link "esticado" que cobre a linha
// (abre a visualização); o switch "Conta no saldo" e os botões ficam por cima (z-index) e não abrem a visualização.
// Modo `lixeira`: sem switch e sem Editar; no lugar, Restaurar. Puro: dados, destinos e ações por props.

export const DICA_CONTA_NO_SALDO = 'Desligado: o lançamento continua na lista, mas não entra no saldo nem no dashboard.'

export type TransactionTableProps = {
  lancamentos: Lancamento[]
  modo?: 'lista' | 'lixeira'
  /** Título da barra do card ("Novembro 2026", "3 lançamentos na lixeira") */
  titulo: string
  /** Legenda à direita do título ("Todos os status · da data mais recente para a mais antiga") */
  legenda?: string
  /** Legenda da tabela para leitor de tela ("Lançamentos de novembro de 2026") */
  descricaoTabela: string
  hrefDe: (lancamento: Lancamento) => string
  onAbrir?: (lancamento: Lancamento, evento: React.MouseEvent<HTMLAnchorElement>) => void
  /** Lista: destino do lápis */
  hrefEditar?: (lancamento: Lancamento) => string
  onAlternarSaldo?: (lancamento: Lancamento, contaNoSaldo: boolean) => void
  onMoverParaLixeira?: (lancamento: Lancamento) => void
  /** Lixeira */
  onRestaurar?: (lancamento: Lancamento) => void
  /** Ids com gravação em andamento (switch ocupado ou Restaurar com spinner) */
  ocupados?: ReadonlySet<number>
  /** Sem internet: o que grava fica desabilitado, com o id do texto do motivo */
  motivoDesabilitado?: string
  /** Rodapé ("Mostrando 12 de 30 lançamentos" + Mostrar mais) */
  rodape?: React.ReactNode
  /** Dica embaixo do card */
  dica?: React.ReactNode
}

export function TransactionTable({
  lancamentos,
  modo = 'lista',
  titulo,
  legenda,
  descricaoTabela,
  hrefDe,
  onAbrir,
  hrefEditar,
  onAlternarSaldo,
  onMoverParaLixeira,
  onRestaurar,
  ocupados,
  motivoDesabilitado,
  rodape,
  dica,
}: TransactionTableProps) {
  const base = useId()
  const idTitulo = `${base}-titulo`
  const idDica = `${base}-dica`
  const lixeira = modo === 'lixeira'
  const desabilitado = Boolean(motivoDesabilitado)

  return (
    <div
      data-slot="transaction-table"
      className="rounded-card border-border bg-card text-card-foreground shadow-card overflow-hidden border"
    >
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <p id={idTitulo} className="text-corpo-forte tabular-nums">
          {titulo}
        </p>
        {legenda && <span className="text-legenda text-muted-foreground">{legenda}</span>}
      </div>
      <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-labelledby={idTitulo}>
        <table className="w-full min-w-[900px] border-collapse tabular-nums">
          <caption className="sr-only">{descricaoTabela}</caption>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              {['Descrição', 'Data', 'Categorias', 'Tipo'].map((coluna) => (
                <Th key={coluna}>{coluna}</Th>
              ))}
              <Th className="text-right">Valor</Th>
              {!lixeira && (
                <Th className="w-32 text-center whitespace-normal">
                  <span className="inline-flex items-center gap-1">
                    Conta no saldo
                    <button
                      type="button"
                      title={DICA_CONTA_NO_SALDO}
                      aria-describedby={dica ? idDica : undefined}
                      className="rounded-pilula hover:bg-border -my-1.5 inline-grid size-7 cursor-help place-items-center"
                    >
                      <Info className="size-4" aria-hidden="true" />
                      <span className="sr-only">O que é Conta no saldo</span>
                    </button>
                  </span>
                </Th>
              )}
              <Th className="text-right">Ações</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lancamentos.map((lancamento) => {
              const { id, descricao, tipo, data, valor, status, categorias } = lancamento
              const esmaecido = status !== 'ATIVO'
              const ocupado = ocupados?.has(id) ?? false
              return (
                <TableRow
                  key={id}
                  data-status={status}
                  className={cn(
                    'border-border hover:bg-background relative cursor-pointer border-b last:border-b-0',
                    esmaecido && 'text-muted-foreground',
                  )}
                >
                  <Td>
                    <Link
                      href={hrefDe(lancamento)}
                      aria-label={`Ver ${descricao}`}
                      title={descricao}
                      onClick={onAbrir ? (evento) => onAbrir(lancamento, evento) : undefined}
                      className="block max-w-[200px] truncate font-bold text-inherit no-underline outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-[var(--ring)]"
                    >
                      {descricao}
                    </Link>
                  </Td>
                  <Td>
                    <time dateTime={data}>{formatarData(data)}</time>
                  </Td>
                  <Td className="whitespace-normal">
                    <span className="flex flex-wrap gap-1">
                      <ChipsDeCategorias categorias={categorias} />
                    </span>
                  </Td>
                  <Td>
                    <Badge
                      variant={esmaecido ? 'contorno' : tipo === 'RECEITA' ? 'receita' : 'despesa'}
                      className={cn(esmaecido && 'shadow-[inset_0_0_0_1px_var(--input)]')}
                    >
                      {tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <MoneyText valor={valor} tipo={tipo} suave={esmaecido} />
                  </Td>
                  {!lixeira && (
                    <Td className="text-center">
                      <span className="relative z-[1] inline-flex">
                        <Switch
                          checked={status === 'ATIVO'}
                          aria-label={`Conta no saldo: ${descricao}`}
                          aria-busy={ocupado || undefined}
                          disabled={ocupado || desabilitado}
                          aria-describedby={motivoDesabilitado}
                          onCheckedChange={(conta) => onAlternarSaldo?.(lancamento, conta)}
                        />
                      </span>
                    </Td>
                  )}
                  <Td>
                    <span className="relative z-[1] flex justify-end gap-1">
                      {lixeira ? (
                        <Button
                          variant="contornado"
                          size="pequeno"
                          className="min-h-11"
                          loading={ocupado}
                          aria-label={`Restaurar ${descricao}`}
                          aria-disabled={desabilitado || undefined}
                          aria-describedby={motivoDesabilitado}
                          onClick={() => {
                            if (!desabilitado) onRestaurar?.(lancamento)
                          }}
                        >
                          {!ocupado && <RotateCcw aria-hidden="true" />}
                          Restaurar
                        </Button>
                      ) : (
                        <>
                          {hrefEditar && (
                            <Button asChild variant="texto" size="icone">
                              <Link href={hrefEditar(lancamento)} aria-label={`Editar ${descricao}`}>
                                <Pencil aria-hidden="true" />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="texto"
                            size="icone"
                            aria-label={`Mover ${descricao} para a lixeira`}
                            aria-disabled={desabilitado || undefined}
                            aria-describedby={motivoDesabilitado}
                            onClick={() => {
                              if (!desabilitado) onMoverParaLixeira?.(lancamento)
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </span>
                  </Td>
                </TableRow>
              )
            })}
          </TableBody>
        </table>
      </div>
      {rodape && (
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
          {rodape}
        </div>
      )}
      {dica && (
        <p
          id={idDica}
          className="border-border text-legenda text-muted-foreground flex items-start gap-2 border-t px-5 py-3"
        >
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{dica}</span>
        </p>
      )}
    </div>
  )
}

function Th({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <TableHead
      scope="col"
      className={cn(
        'text-rotulo-secao text-muted-foreground bg-secondary border-border h-auto border-b p-3 uppercase',
        className,
      )}
      {...props}
    />
  )
}

function Td({ className, ...props }: React.ComponentProps<'td'>) {
  return <TableCell className={cn('text-corpo h-15 px-3 py-2', className)} {...props} />
}
