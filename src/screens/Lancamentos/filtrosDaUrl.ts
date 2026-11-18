import type { FiltrosLista } from '@/components/organisms/filter-bar'
import { formatarMesAno } from '@/lib/format'
import type { CategoriaResumo, FiltrosLancamentos, MesAno } from '@/types/api'

// Filtros de Lançamentos na URL (DS FilterBar): /lancamentos?mes=11&ano=2026&q=mercado&tipo=DESPESA&status=ATIVO&categoria=3
// e `ver=<id>` para o painel da visualização no tablet/computador.
type LeitorDeParametros = { get(nome: string): string | null }

export function lerFiltros(parametros: LeitorDeParametros): FiltrosLista {
  const tipo = parametros.get('tipo')
  const status = parametros.get('status')
  const categoria = Number(parametros.get('categoria'))
  return {
    q: parametros.get('q') ?? '',
    tipo: tipo === 'RECEITA' || tipo === 'DESPESA' ? tipo : null,
    status: status === 'ATIVO' || status === 'INATIVO' ? status : null,
    categoriaId: Number.isInteger(categoria) && categoria > 0 ? categoria : null,
  }
}

/** Query string com os filtros novos, preservando o resto (mês, ano) */
export function comFiltros(parametros: URLSearchParams | string, filtros: FiltrosLista): string {
  const novos = new URLSearchParams(parametros)
  const definir = (nome: string, valor: string | null) => (valor ? novos.set(nome, valor) : novos.delete(nome))
  definir('q', filtros.q.trim() || null)
  definir('tipo', filtros.tipo)
  definir('status', filtros.status)
  definir('categoria', filtros.categoriaId === null ? null : String(filtros.categoriaId))
  return novos.toString()
}

export function lerVer(parametros: LeitorDeParametros): number | undefined {
  const id = Number(parametros.get('ver'))
  return Number.isInteger(id) && id > 0 ? id : undefined
}

/** Filtros da API (lista e exportação) */
export function paraApi(filtros: FiltrosLista, periodo: MesAno): FiltrosLancamentos {
  return {
    mes: periodo.mes,
    ano: periodo.ano,
    descricao: filtros.q.trim() || undefined,
    tipo: filtros.tipo ?? undefined,
    status: filtros.status ?? undefined,
    categoriaId: filtros.categoriaId ?? undefined,
  }
}

const ROTULO_STATUS = { ATIVO: 'Ativos', INATIVO: 'Inativos' } as const

/** "Despesa · Mercado · Todos os status" (legenda da tabela) */
export function descreverFiltros(filtros: FiltrosLista, categorias: CategoriaResumo[]): string {
  const partes: string[] = []
  if (filtros.q.trim()) partes.push(`“${filtros.q.trim()}”`)
  if (filtros.tipo) partes.push(filtros.tipo === 'RECEITA' ? 'Receita' : 'Despesa')
  const categoria = categorias.find((c) => c.id === filtros.categoriaId)
  if (categoria) partes.push(categoria.descricao)
  partes.push(filtros.status ? ROTULO_STATUS[filtros.status] : 'Todos os status')
  return partes.join(' · ')
}

/** "Novembro 2026 · Todos os status" (aviso do Exportar) */
export function filtrosParaExportar(filtros: FiltrosLista, categorias: CategoriaResumo[], periodo: MesAno) {
  return `${formatarMesAno(periodo.mes, periodo.ano)} · ${descreverFiltros(filtros, categorias)}`
}

/** "Novembro 2026 · os que contam e os que não contam no saldo" (resumo do Exportar) */
export function origemParaExportar(filtros: FiltrosLista, periodo: MesAno) {
  const mes = formatarMesAno(periodo.mes, periodo.ano)
  if (filtros.status === 'ATIVO') return `${mes} · só os que contam no saldo`
  if (filtros.status === 'INATIVO') return `${mes} · só os que não contam no saldo`
  return `${mes} · os que contam e os que não contam no saldo`
}
