'use client'

import type * as React from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/atoms/chart'
import {
  formatarIntervaloMeses,
  formatarMarca,
  intervaloPorExtenso,
  marcasDoEixo,
  mesAbreviado,
  mesPorExtenso,
} from '@/lib/escala-grafico'
import { formatarMoeda } from '@/lib/format'
import type { ResumoMes } from '@/types/api'
import { DashboardSecao, GraficoCarregando, MarcaDoEixo, MesDoEixo, type TickDoMes } from './dashboard-secao'

// IncomeExpenseChart do Design System: área Receitas × Despesas dos últimos 4 meses (RN008, DS Gráficos.md).
// Curvas monotônicas (nunca passam dos valores reais), linhas de 2,5px em receita/despesa-grafico, preenchimento
// receita/despesa-area, pontos nos meses, grade tracejada, linha do zero sólida e eixo do zero com 3 marcas redondas.
// A área de despesas recorta a de receitas (uma camada na cor da superfície por baixo dela), para as cores não se misturarem.
// Cor nunca sozinha: legenda em texto, dica com os nomes e tabela `sr-only` com os dados.

const config = {
  receitas: { label: 'Receitas', color: 'var(--chart-1)' },
  despesas: { label: 'Despesas', color: 'var(--chart-2)' },
} satisfies ChartConfig

type IncomeExpenseChartProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  /** `ultimosMeses` de `GET /dashboard`, do mais antigo ao mês pedido */
  dados: ResumoMes[]
  carregando?: boolean
}

type Linha = ResumoMes & { rotulo: string }

function IncomeExpenseChart({ dados, carregando = false, ...props }: IncomeExpenseChartProps) {
  if (carregando) return <GraficoCarregando titulo="Receitas × Despesas" barras={8} {...props} />

  const linhas: Linha[] = dados.map((d) => ({ ...d, rotulo: mesAbreviado(d.mes) }))
  const marcas = marcasDoEixo(dados.flatMap((d) => [d.receitas, d.despesas]))
  const ultimo = linhas.at(-1)?.rotulo

  return (
    <DashboardSecao
      data-slot="income-expense-chart"
      idTitulo="grafico-receitas-despesas"
      titulo="Receitas × Despesas"
      lado={formatarIntervaloMeses(dados)}
      {...props}
    >
      <figure aria-labelledby="grafico-receitas-despesas" className="flex flex-1 flex-col justify-center gap-3">
        <ul className="text-legenda flex flex-wrap gap-x-4 gap-y-2 font-semibold">
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="bg-receita-grafico h-1 w-4 rounded-xs" />
            Receitas
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="bg-despesa-grafico h-1 w-4 rounded-xs" />
            Despesas
          </li>
        </ul>
        <ChartContainer config={config} className="aspect-auto h-56 w-full md:h-64">
          <AreaChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <YAxis
              ticks={marcas}
              interval={0}
              domain={[marcas[0], marcas.at(-1) ?? 0]}
              axisLine={false}
              tickLine={false}
              width={64}
              tick={(tick: TickDoMes) => <MarcaDoEixo {...tick} formatar={formatarMarca} />}
            />
            <XAxis
              dataKey="rotulo"
              padding={{ left: 24, right: 24 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval={0}
              tick={(tick: TickDoMes) => <MesDoEixo {...tick} ultimo={ultimo} />}
            />
            <ReferenceLine y={0} stroke="var(--input)" strokeWidth={1.5} />
            <ChartTooltip
              cursor={{ stroke: 'var(--input)', strokeDasharray: '3 3' }}
              content={<DicaDoMes />}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="var(--color-receitas)"
              strokeWidth={2.5}
              fill="var(--receita-area)"
              fillOpacity={1}
              dot={{ r: 4, fill: 'var(--color-receitas)', stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: 'var(--color-receitas)', stroke: 'var(--card)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {/* recorte: a superfície apaga o verde por baixo da curva de despesas */}
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="none"
              fill="var(--card)"
              fillOpacity={1}
              legendType="none"
              tooltipType="none"
              activeDot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="var(--color-despesas)"
              strokeWidth={2.5}
              fill="var(--despesa-area)"
              fillOpacity={1}
              dot={{ r: 4, fill: 'var(--color-despesas)', stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: 'var(--color-despesas)', stroke: 'var(--card)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
        <div className="sr-only">
          <table>
            <caption>Receitas e despesas por mês, {intervaloPorExtenso(dados)}</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Receitas</th>
                <th scope="col">Despesas</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={`${d.ano}-${d.mes}`}>
                  <th scope="row">{mesPorExtenso(d.mes, d.ano)}</th>
                  <td>{formatarMoeda(d.receitas)}</td>
                  <td>{formatarMoeda(d.despesas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    </DashboardSecao>
  )
}

type DicaProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: Linha }> }

/** Dica do mês: "Nov · Receitas: R$ 12.480,50 · Despesas: R$ 7.560,50", nomes nas cores de texto da função */
function DicaDoMes({ active, payload }: DicaProps) {
  const linha = payload?.[0]?.payload
  if (!active || !linha) return null
  return (
    <div className="border-border bg-card text-card-foreground shadow-flutuante rounded-campo grid gap-0.5 border px-3 py-2 text-[11px] leading-4 font-semibold tabular-nums">
      <p className="text-xs font-extrabold">{linha.rotulo}</p>
      <p>
        <span className="text-receita font-extrabold">Receitas:</span> {formatarMoeda(linha.receitas)}
      </p>
      <p>
        <span className="text-despesa font-extrabold">Despesas:</span> {formatarMoeda(linha.despesas)}
      </p>
    </div>
  )
}

export { DicaDoMes, IncomeExpenseChart }
export type { IncomeExpenseChartProps }
