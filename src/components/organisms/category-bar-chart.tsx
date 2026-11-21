import { ChartNoAxesColumn, ChevronRight, List } from 'lucide-react'
import Link from 'next/link'
import type * as React from 'react'
import { EmptyState } from '@/components/molecules/empty-state'
import { ROTAS } from '@/constants/rotas'
import { formatarMoeda, formatarPeriodo } from '@/lib/format'
import type { DespesaPorCategoria } from '@/types/api'
import { DashboardSecao, ListaCarregando } from './dashboard-secao'

// CategoryBarChart do Design System: despesas do mês por categoria em barras horizontais, todas em despesa-grafico
// (a cor diferencia tipos, não categorias), da maior para a menor, com o valor exato no fim da barra.
// Cada linha é um link para Lançamentos filtrado pela categoria e pelo mesmo mês (`?categoria=&mes=&ano=&tipo=DESPESA`,
// os mesmos nomes que a tela de Lançamentos lê da URL).
// A lista de links já é a versão em texto do gráfico (a barra é decorativa). RN009: os valores vêm divididos da API.
// `previa` (Landing, dados de exemplo): sem links, sem o total e sem a dica de toque, como na prancheta landing-computador.

type CategoryBarChartProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  /** `despesasPorCategoria` de `GET /dashboard` (o componente ordena do maior para o menor) */
  dados: DespesaPorCategoria[]
  /** Total de despesas do mês */
  total: number
  mes: number
  ano: number
  carregando?: boolean
  /** Prévia com dados de exemplo (Landing): linhas sem link, sem total e sem dica; título h3 */
  previa?: boolean
}

/** Lançamentos da categoria no mês: `/lancamentos?categoria=2&mes=11&ano=2026&tipo=DESPESA` */
export function hrefDaCategoria(categoriaId: number, mes: number, ano: number): string {
  const busca = new URLSearchParams({
    categoria: String(categoriaId),
    mes: String(mes),
    ano: String(ano),
    tipo: 'DESPESA',
  })
  return `${ROTAS.lancamentos}?${busca.toString()}`
}

function CategoryBarChart({
  dados,
  total,
  mes,
  ano,
  carregando = false,
  previa = false,
  ...props
}: CategoryBarChartProps) {
  if (carregando) return <ListaCarregando titulo="Despesas por categoria" barras={4} {...props} />

  const ordenados = [...dados].sort((a, b) => b.valor - a.valor)
  const maior = ordenados[0]?.valor ?? 0

  return (
    <DashboardSecao
      data-slot="category-bar-chart"
      idTitulo="grafico-categorias"
      titulo="Despesas por categoria"
      lado={formatarPeriodo(mes, ano)}
      nivelTitulo={previa ? 'h3' : 'h2'}
      {...props}
    >
      {!previa && (
        <p className="text-legenda text-muted-foreground mb-3">
          Total de despesas: <strong className="text-foreground tabular-nums">{formatarMoeda(total)}</strong>
        </p>
      )}
      {ordenados.length === 0 ? (
        <EmptyState
          icone={ChartNoAxesColumn}
          titulo="Não há informações disponíveis para o período"
          texto="As despesas do mês aparecem aqui, separadas por categoria."
          nivel="h3"
          superficie="sem-cartao"
        />
      ) : (
        <ul aria-labelledby="grafico-categorias" className="flex flex-col gap-1">
          {ordenados.map((categoria) => {
            const valor = formatarMoeda(categoria.valor)
            const proporcao = maior > 0 ? categoria.valor / maior : 0
            const barra = (
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="bg-despesa-grafico h-3.5 min-w-1 shrink-0 rounded-r-sm"
                  style={{ width: `calc((100% - 104px) * ${proporcao})` }}
                />
                <span className="text-legenda font-bold whitespace-nowrap tabular-nums">{valor}</span>
              </span>
            )
            if (previa) {
              return (
                <li
                  key={categoria.categoriaId}
                  className="text-foreground flex min-h-13 flex-col justify-center gap-1.5 py-2"
                >
                  <span className="text-legenda min-w-0 truncate font-bold">{categoria.descricao}</span>
                  {barra}
                </li>
              )
            }
            return (
              <li key={categoria.categoriaId}>
                <Link
                  href={hrefDaCategoria(categoria.categoriaId, mes, ano)}
                  aria-label={`${categoria.descricao}: ${valor}. Ver lançamentos de ${categoria.descricao}`}
                  className="text-foreground hover:bg-secondary -mx-2 flex min-h-13 flex-col justify-center gap-1.5 rounded-sm p-2 transition-colors"
                >
                  <span className="text-legenda flex items-center justify-between gap-2 font-bold">
                    <span className="min-w-0 truncate">{categoria.descricao}</span>
                    <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  </span>
                  {barra}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {!previa && ordenados.length > 0 && (
        <p className="text-legenda text-muted-foreground mt-3 flex items-center gap-2">
          <List className="size-4 shrink-0" aria-hidden="true" />
          Tocar numa categoria abre Lançamentos filtrados por ela.
        </p>
      )}
    </DashboardSecao>
  )
}

export { CategoryBarChart }
export type { CategoryBarChartProps }
