'use client'

import { EyeOff, Info, Pencil, RotateCcw, Tag } from 'lucide-react'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/cn'
import type { CategoriaComContagem } from '@/types/api'

// Lista de categorias (pranchetas categorias-celular e categorias-computador).
// - Abaixo de 1024px: cards "Ativas · N" (lápis para editar) e "Inativas · N" tracejado (Reativar).
// - A partir de 1024px: tabela com Categoria, Lançamentos no mês, Situação e Ações, inativas num grupo no fim.
// A troca é só CSS. Puro: dados, mês e ações chegam por props.

export type CategoriaListaProps = {
  categorias: CategoriaComContagem[]
  /** Mês da contagem: "Nov/2026" */
  periodo: string
  onEditar: (categoria: CategoriaComContagem) => void
  onReativar: (categoria: CategoriaComContagem) => void
  /** Categoria sendo reativada agora (spinner no botão) */
  reativandoId?: number | null
  /** Sem internet: Reativar fica desabilitado e aponta para o motivo (`aria-describedby`) */
  motivoBloqueioId?: string
  className?: string
}

const quantos = (n: number) => `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`

export function CategoriaLista({
  categorias,
  periodo,
  onEditar,
  onReativar,
  reativandoId,
  motivoBloqueioId,
  className,
}: CategoriaListaProps) {
  const ativas = categorias.filter((c) => c.ativa)
  const inativas = categorias.filter((c) => !c.ativa)

  const botaoEditar = (categoria: CategoriaComContagem) => (
    <Button
      variant="texto"
      size="icone"
      aria-label={`Editar categoria ${categoria.descricao}`}
      onClick={() => onEditar(categoria)}
    >
      <Pencil aria-hidden="true" />
    </Button>
  )

  const botaoReativar = (categoria: CategoriaComContagem) => (
    <Button
      variant="contornado"
      size="pequeno"
      className="min-h-11"
      aria-label={`Reativar ${categoria.descricao}`}
      loading={reativandoId === categoria.id}
      aria-disabled={motivoBloqueioId ? true : undefined}
      aria-describedby={motivoBloqueioId}
      onClick={() => !motivoBloqueioId && onReativar(categoria)}
    >
      {reativandoId !== categoria.id && <RotateCcw aria-hidden="true" />}
      Reativar
    </Button>
  )

  return (
    <div data-slot="categoria-lista" className={className}>
      {/* Celular e tablet: cards */}
      <div data-slot="categoria-lista-cartoes" className="flex flex-col gap-5 lg:hidden">
        {ativas.length > 0 && (
          <section aria-labelledby="categorias-ativas">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="categorias-ativas" className="text-rotulo-secao text-muted-foreground uppercase">
                Ativas · {ativas.length}
              </h2>
              <span className="text-legenda text-muted-foreground">Lançamentos em {periodo}</span>
            </div>
            <ul className="rounded-card border-border bg-card shadow-card flex flex-col border py-1 pr-2 pl-4">
              {ativas.map((categoria) => (
                <li
                  key={categoria.id}
                  className="border-border flex min-h-14 items-center gap-3 border-t py-2 first:border-t-0"
                >
                  <span className="rounded-icone bg-secondary text-foreground grid size-10 shrink-0 place-items-center">
                    <Tag className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold">{categoria.descricao}</span>
                    <span className="text-legenda text-muted-foreground tabular-nums">
                      {quantos(categoria.quantidadeLancamentos)}
                    </span>
                  </span>
                  {botaoEditar(categoria)}
                </li>
              ))}
            </ul>
          </section>
        )}
        {inativas.length > 0 && (
          <section aria-labelledby="categorias-inativas">
            <h2 id="categorias-inativas" className="text-rotulo-secao text-muted-foreground mb-3 uppercase">
              Inativas · {inativas.length}
            </h2>
            <ul className="rounded-card border-input flex flex-col border border-dashed py-1 pr-2 pl-4">
              {inativas.map((categoria) => (
                <li
                  key={categoria.id}
                  className="border-border flex min-h-14 items-center gap-3 border-t py-2 first:border-t-0"
                >
                  <span className="rounded-icone text-muted-foreground grid size-10 shrink-0 place-items-center">
                    <EyeOff className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-muted-foreground truncate font-bold">{categoria.descricao}</span>
                    <span className="text-legenda text-muted-foreground">Não aparece para escolher</span>
                  </span>
                  {botaoReativar(categoria)}
                </li>
              ))}
            </ul>
            <p className="text-legenda text-muted-foreground mt-2">
              Os lançamentos antigos continuam com a categoria inativa.
            </p>
          </section>
        )}
      </div>

      {/* Computador: tabela */}
      <div
        data-slot="categoria-lista-tabela"
        className="rounded-card border-border bg-card text-card-foreground shadow-card hidden overflow-hidden border lg:block"
      >
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <p id="categorias-contador" className="text-corpo-forte tabular-nums">
            {categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}
          </p>
          <span className="text-legenda text-muted-foreground tabular-nums">
            {ativas.length} {ativas.length === 1 ? 'ativa' : 'ativas'} · {inativas.length}{' '}
            {inativas.length === 1 ? 'inativa' : 'inativas'}
          </span>
        </div>
        <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-labelledby="categorias-contador">
          <table className="w-full min-w-180 border-collapse tabular-nums">
            <caption className="sr-only">Categorias do usuário</caption>
            <thead>
              <tr>
                {['Categoria', `Lançamentos em ${periodo}`, 'Situação', 'Ações'].map((titulo, i) => (
                  <th
                    key={titulo}
                    scope="col"
                    className={cn(
                      'text-rotulo-secao text-muted-foreground bg-secondary border-border border-b p-3 text-left whitespace-nowrap uppercase',
                      (i === 1 || i === 3) && 'text-right',
                    )}
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ativas.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-background">
                  <td className="border-border h-15 border-b px-3 py-2">
                    <span className="block max-w-50 truncate font-bold">{categoria.descricao}</span>
                  </td>
                  <td className="border-border border-b px-3 py-2 text-right">{categoria.quantidadeLancamentos}</td>
                  <td className="border-border border-b px-3 py-2">
                    <Badge variant="receita">Ativa</Badge>
                  </td>
                  <td className="border-border border-b px-3 py-2">
                    <span className="flex justify-end gap-1">{botaoEditar(categoria)}</span>
                  </td>
                </tr>
              ))}
              {inativas.length > 0 && (
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={4}
                    className="text-rotulo-secao text-muted-foreground bg-secondary border-border border-b p-3 text-left uppercase"
                  >
                    Inativas · {inativas.length}
                  </th>
                </tr>
              )}
              {inativas.map((categoria) => (
                <tr key={categoria.id} className="text-muted-foreground hover:bg-background">
                  <td className="border-border h-15 border-b px-3 py-2 last:border-b-0">
                    <span className="block max-w-50 truncate font-bold">{categoria.descricao}</span>
                  </td>
                  <td className="border-border border-b px-3 py-2 text-right">{categoria.quantidadeLancamentos}</td>
                  <td className="border-border border-b px-3 py-2">
                    <Badge variant="contorno">
                      <EyeOff aria-hidden="true" />
                      Inativa
                    </Badge>
                  </td>
                  <td className="border-border border-b px-3 py-2">
                    <span className="flex justify-end gap-1">
                      {botaoReativar(categoria)}
                      {botaoEditar(categoria)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-legenda text-muted-foreground border-border flex items-start gap-2 border-t px-5 py-3">
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Inativa</strong>: sai da lista de escolha, mas os lançamentos antigos continuam com ela. Só dá para
            excluir uma categoria sem lançamentos.
          </span>
        </p>
      </div>
    </div>
  )
}
