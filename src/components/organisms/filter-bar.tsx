'use client'

import { ChevronDown, Download, FileDown, FileUp, Search, SlidersHorizontal, Trash2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import type * as React from 'react'
import { Button } from '@/components/atoms/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { Input } from '@/components/atoms/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/atoms/sheet'
import { Chip, ChipGroup } from '@/components/molecules/chip'
import { FilterChip } from '@/components/molecules/filter-chip'
import { MonthNavigator } from '@/components/molecules/month-navigator'
import { SegmentedControl, type OpcaoSegmentada } from '@/components/molecules/segmented-control'
import { cn } from '@/lib/cn'
import type { CategoriaResumo, MesAno, TipoLancamento } from '@/types/api'

// FilterBar do Design System (filtros de Lançamentos, RF005). Tablet e computador (≥ 768px): barra em card com busca, tipo,
// categoria e mês; embaixo status, total, "Limpar filtros", Exportar e Importar. Celular: "Filtros" (com o número de ativos),
// busca (ícone), Exportar e Importar; chips removíveis dos filtros ativos e a folha de filtros. A troca de layout é só CSS.
// Puro: os filtros chegam por props e voltam por `onChange` (a tela guarda na URL). O texto da busca também vem por props
// (`busca`/`onBuscaChange`): é a tela que espera a pessoa parar de digitar (500 ms) e leva a busca para a URL.

export type StatusDoFiltro = 'ATIVO' | 'INATIVO'
export type FiltrosLista = {
  /** Busca por descrição */
  q: string
  tipo: TipoLancamento | null
  status: StatusDoFiltro | null
  categoriaId: number | null
}

export const FILTROS_VAZIOS: FiltrosLista = { q: '', tipo: null, status: null, categoriaId: null }

const ROTULO_TIPO: Record<TipoLancamento, string> = { RECEITA: 'Receita', DESPESA: 'Despesa' }
const ROTULO_STATUS: Record<StatusDoFiltro, string> = { ATIVO: 'Ativos', INATIVO: 'Inativos' }

type ValorStatus = 'todos' | StatusDoFiltro | 'lixeira'
const OPCOES_STATUS: OpcaoSegmentada<ValorStatus>[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativos' },
  { value: 'INATIVO', label: 'Inativos' },
  { value: 'lixeira', label: 'Lixeira', icon: <Trash2 className="size-4" aria-hidden="true" /> },
]
type ValorTipo = 'todos' | TipoLancamento
const OPCOES_TIPO: OpcaoSegmentada<ValorTipo>[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'RECEITA', label: 'Receita', funcao: 'receita' },
  { value: 'DESPESA', label: 'Despesa', funcao: 'despesa' },
]

/** Quantos filtros da folha estão ligados (tipo, status, categoria) */
export function contarFiltrosAtivos({ tipo, status, categoriaId }: FiltrosLista) {
  return [tipo, status, categoriaId].filter((valor) => valor !== null).length
}

export function temFiltro(filtros: FiltrosLista) {
  return contarFiltrosAtivos(filtros) > 0 || filtros.q.trim() !== ''
}

export type FilterBarProps = {
  filtros: FiltrosLista
  /** O que está no campo de busca agora (pode estar à frente de `filtros.q`, que é a busca já aplicada) */
  busca: string
  onBuscaChange: (texto: string) => void
  /** Categorias para o filtro (lista simples, sem criar nem editar) */
  categorias: CategoriaResumo[]
  periodo: MesAno
  onMudarMes: (periodo: MesAno) => void
  onChange: (mudanca: Partial<FiltrosLista>) => void
  onLimpar: () => void
  /** Status "Lixeira": a tela leva para a Lixeira (não depende do mês) */
  onIrParaLixeira: () => void
  /** Total depois dos filtros ("30 lançamentos"); `null` enquanto carrega */
  total: number | null
  onExportar: () => void
  hrefImportar: string
  onBaixarModelo: () => void
  className?: string
}

const plural = (n: number) => `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`

export function FilterBar({
  filtros,
  busca,
  onBuscaChange,
  categorias,
  periodo,
  onMudarMes,
  onChange,
  onLimpar,
  onIrParaLixeira,
  total,
  onExportar,
  hrefImportar,
  onBaixarModelo,
  className,
}: FilterBarProps) {
  const base = useId()
  const [buscaAberta, setBuscaAberta] = useState(busca !== '')
  const [folhaAberta, setFolhaAberta] = useState(false)

  const nomeCategoria = categorias.find((c) => c.id === filtros.categoriaId)?.descricao
  const ativos = contarFiltrosAtivos(filtros)
  const algumFiltro = temFiltro(filtros)
  const textoTotal = total === null ? 'Carregando…' : plural(total)

  const escolherStatus = (valor: ValorStatus) => {
    if (valor === 'lixeira') onIrParaLixeira()
    else onChange({ status: valor === 'todos' ? null : valor })
  }

  const campoBusca = (id: string, extra?: string) => (
    <div className={cn('relative', extra)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        placeholder="Descrição do lançamento"
        value={busca}
        onChange={(evento) => onBuscaChange(evento.target.value)}
        className="pl-10"
      />
    </div>
  )

  const menuImportar = (gatilho: React.ReactNode) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{gatilho}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild className="min-h-11">
          <Link href={hrefImportar}>
            <FileUp aria-hidden="true" />
            Importar arquivo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11" onSelect={onBaixarModelo}>
          <FileDown aria-hidden="true" />
          Baixar modelo CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div data-slot="filter-bar" className={className}>
      {/* ---------- tablet e computador ---------- */}
      <form
        role="search"
        aria-label="Filtrar lançamentos"
        onSubmit={(evento) => evento.preventDefault()}
        className="rounded-card border-border bg-card shadow-card hidden flex-col gap-3 border p-4 md:flex"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-[2_1_220px] flex-col gap-1.5">
            <label htmlFor={`${base}-busca`} className="text-rotulo-campo">
              Buscar
            </label>
            {campoBusca(`${base}-busca`)}
          </div>
          <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
            <label id={`${base}-tipo`} className="text-rotulo-campo">
              Tipo
            </label>
            <Select
              value={filtros.tipo ?? 'todos'}
              onValueChange={(valor) => onChange({ tipo: valor === 'todos' ? null : (valor as TipoLancamento) })}
            >
              <SelectTrigger aria-labelledby={`${base}-tipo`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-1.5">
            <label id={`${base}-categoria`} className="text-rotulo-campo">
              Categoria
            </label>
            <Select
              value={filtros.categoriaId === null ? 'todas' : String(filtros.categoriaId)}
              onValueChange={(valor) => onChange({ categoriaId: valor === 'todas' ? null : Number(valor) })}
            >
              <SelectTrigger aria-labelledby={`${base}-categoria`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={String(categoria.id)}>
                    {categoria.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-none flex-col gap-1.5">
            <span className="text-rotulo-campo">Mês</span>
            <MonthNavigator
              variante="compacto"
              contornado
              seletor="popover"
              mes={periodo.mes}
              ano={periodo.ano}
              onChange={onMudarMes}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label="Status"
            options={OPCOES_STATUS}
            value={filtros.status ?? 'todos'}
            onChange={escolherStatus}
          />
          <span role="status" className="text-legenda text-muted-foreground whitespace-nowrap tabular-nums">
            {textoTotal}
          </span>
          {algumFiltro && (
            <Button variant="texto" size="pequeno" onClick={onLimpar}>
              <X aria-hidden="true" />
              Limpar filtros
            </Button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="contornado" size="pequeno" aria-haspopup="dialog" onClick={onExportar}>
              <Download aria-hidden="true" />
              Exportar
            </Button>
            {menuImportar(
              <Button variant="contornado" size="pequeno">
                <Upload aria-hidden="true" />
                Importar
                <ChevronDown aria-hidden="true" />
              </Button>,
            )}
          </div>
        </div>
      </form>

      {/* ---------- celular ---------- */}
      <div role="search" aria-label="Filtrar lançamentos" className="-mx-3 flex flex-col gap-2 p-3 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="contornado"
            size="pequeno"
            aria-haspopup="dialog"
            aria-label={ativos > 0 ? `Filtros, ${ativos} ${ativos === 1 ? 'ativo' : 'ativos'}` : 'Filtros'}
            onClick={() => setFolhaAberta(true)}
          >
            <SlidersHorizontal aria-hidden="true" />
            Filtros
            {ativos > 0 && (
              <span
                aria-hidden="true"
                className="rounded-pilula bg-primary text-primary-foreground inline-grid h-[22px] min-w-[22px] place-items-center px-1.5 text-xs font-extrabold tabular-nums"
              >
                {ativos}
              </span>
            )}
          </Button>
          <Button
            variant="texto"
            size="icone"
            aria-label="Buscar lançamentos"
            aria-expanded={buscaAberta}
            onClick={() => setBuscaAberta((aberta) => !aberta)}
          >
            <Search aria-hidden="true" />
          </Button>
          <Button
            variant="texto"
            size="icone"
            aria-label="Exportar"
            aria-haspopup="dialog"
            className="ml-auto"
            onClick={onExportar}
          >
            <Download aria-hidden="true" />
          </Button>
          {menuImportar(
            <Button variant="texto" size="icone" aria-label="Importar">
              <Upload aria-hidden="true" />
            </Button>,
          )}
        </div>
        {buscaAberta && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${base}-busca-celular`} className="sr-only">
              Buscar
            </label>
            {campoBusca(`${base}-busca-celular`)}
          </div>
        )}
        {algumFiltro && (
          <div role="group" aria-label="Filtros ativos" className="flex items-center gap-2 overflow-x-auto px-0.5 py-1">
            {filtros.q.trim() !== '' && (
              <Chip ativo className="flex-none" removerLabel="Remover busca" onRemove={() => onChange({ q: '' })}>
                {`“${filtros.q.trim()}”`}
              </Chip>
            )}
            {filtros.tipo && (
              <Chip
                ativo
                className="flex-none"
                removerLabel={`Remover filtro Tipo: ${ROTULO_TIPO[filtros.tipo]}`}
                onRemove={() => onChange({ tipo: null })}
              >
                {ROTULO_TIPO[filtros.tipo]}
              </Chip>
            )}
            {filtros.status && (
              <Chip
                ativo
                className="flex-none"
                removerLabel={`Remover filtro Status: ${ROTULO_STATUS[filtros.status]}`}
                onRemove={() => onChange({ status: null })}
              >
                {ROTULO_STATUS[filtros.status]}
              </Chip>
            )}
            {nomeCategoria && (
              <Chip
                ativo
                className="flex-none"
                removerLabel={`Remover filtro Categoria: ${nomeCategoria}`}
                onRemove={() => onChange({ categoriaId: null })}
              >
                {nomeCategoria}
              </Chip>
            )}
            <Button variant="texto" size="pequeno" onClick={onLimpar}>
              Limpar
            </Button>
          </div>
        )}
        <span role="status" className="text-legenda text-muted-foreground tabular-nums">
          {textoTotal}
        </span>
      </div>

      <FolhaDeFiltros
        aberta={folhaAberta}
        onAbertaChange={setFolhaAberta}
        filtros={filtros}
        categorias={categorias}
        onAplicar={(novos) => {
          setFolhaAberta(false)
          onChange(novos)
        }}
        onIrParaLixeira={() => {
          setFolhaAberta(false)
          onIrParaLixeira()
        }}
      />
    </div>
  )
}

type FolhaDeFiltrosProps = {
  aberta: boolean
  onAbertaChange: (aberta: boolean) => void
  filtros: FiltrosLista
  categorias: CategoriaResumo[]
  onAplicar: (filtros: Omit<FiltrosLista, 'q'>) => void
  onIrParaLixeira: () => void
}

/** Folha de baixo do celular: tipo, status e categoria num rascunho; "Aplicar filtros" grava, "Limpar" zera o rascunho */
function FolhaDeFiltros({
  aberta,
  onAbertaChange,
  filtros,
  categorias,
  onAplicar,
  onIrParaLixeira,
}: FolhaDeFiltrosProps) {
  const base = useId()
  const [rascunho, setRascunho] = useState(filtros)
  const [abertaAntes, setAbertaAntes] = useState(aberta)
  if (aberta !== abertaAntes) {
    setAbertaAntes(aberta)
    if (aberta) setRascunho(filtros)
  }

  return (
    <Sheet open={aberta} onOpenChange={onAbertaChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        overlayClassName="bg-sobreposicao supports-backdrop-filter:backdrop-blur-none"
        className="rounded-t-grande bg-card text-foreground shadow-flutuante flex max-h-[85dvh] flex-col gap-4 overflow-y-auto border-0 px-5 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))]"
      >
        <span aria-hidden="true" className="rounded-pilula bg-input h-1 w-10 self-center" />
        <div className="flex items-center justify-between gap-3">
          <SheetTitle className="text-titulo-2 font-bold">Filtros</SheetTitle>
          <SheetClose
            aria-label="Fechar filtros"
            className="rounded-pilula text-foreground hover:bg-secondary inline-grid size-11 place-items-center"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        </div>
        <SegmentedControl
          label="Tipo"
          bloco
          options={OPCOES_TIPO}
          value={rascunho.tipo ?? 'todos'}
          onChange={(valor) => setRascunho((r) => ({ ...r, tipo: valor === 'todos' ? null : valor }))}
        />
        <div className="flex flex-col gap-1.5">
          <SegmentedControl
            label="Status"
            bloco
            options={OPCOES_STATUS}
            value={rascunho.status ?? 'todos'}
            onChange={(valor) => {
              if (valor === 'lixeira') onIrParaLixeira()
              else setRascunho((r) => ({ ...r, status: valor === 'todos' ? null : valor }))
            }}
          />
          <span className="text-legenda text-muted-foreground">
            Lixeira mostra os lançamentos excluídos de todos os meses.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={`${base}-categoria`} className="text-rotulo-campo">
            Categoria
          </span>
          <ChipGroup role="group" aria-labelledby={`${base}-categoria`}>
            {categorias.map((categoria) => (
              <FilterChip
                key={categoria.id}
                pressed={rascunho.categoriaId === categoria.id}
                onPressedChange={(ligado) => setRascunho((r) => ({ ...r, categoriaId: ligado ? categoria.id : null }))}
              >
                {categoria.descricao}
              </FilterChip>
            ))}
          </ChipGroup>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="contornado" onClick={() => setRascunho({ ...FILTROS_VAZIOS, q: rascunho.q })}>
            Limpar
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              onAplicar({ tipo: rascunho.tipo, status: rascunho.status, categoriaId: rascunho.categoriaId })
            }
          >
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
