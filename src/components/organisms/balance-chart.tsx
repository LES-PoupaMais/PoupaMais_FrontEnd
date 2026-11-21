'use client'

import type * as React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/atoms/chart'
import {
  formatarIntervaloMeses,
  formatarMarca,
  formatarSaldoCurto,
  intervaloPorExtenso,
  marcasDoEixo,
  mesAbreviado,
  mesPorExtenso,
} from '@/lib/escala-grafico'
import { formatarMoeda } from '@/lib/format'
import type { ResumoMes } from '@/types/api'
import { DashboardSecao, GraficoCarregando, MarcaDoEixo, MesDoEixo, type TickDoMes } from './dashboard-secao'

// BalanceChart do Design System: saldo de cada mês (receitas − despesas) em barras verticais (MUDANCAS_RODADA2 §3).
// Positivo em receita-grafico acima do zero; negativo em despesa-grafico abaixo dele. Valor com sinal e centavos em cada barra
// ("+4.920,00", "−750,40"), acima da positiva e abaixo da negativa. Escala com domínio próprio (zero + marcas redondas).
// Ponta arredondada de 4px só na extremidade longe do zero. Tabela `sr-only` com "positivo, R$ …" / "negativo, menos R$ …".

const config = {
  saldo: { label: 'Saldo', color: 'var(--chart-1)' },
} satisfies ChartConfig

type BalanceChartProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  /** `ultimosMeses` de `GET /dashboard` (os mesmos 4 meses do gráfico de área) */
  dados: ResumoMes[]
  carregando?: boolean
}

type Medida = number | string | undefined
type Retangulo = { x?: Medida; y?: Medida; width?: Medida; height?: Medida }

/** Caixa da barra sempre com altura positiva (o Recharts manda altura negativa para valores abaixo do zero) */
function caixa(r: Retangulo) {
  const [x, y, largura, altura] = [r.x, r.y, r.width, r.height].map((v) => Number(v ?? 0) || 0)
  return { x, topo: Math.min(y, y + altura), largura, altura: Math.abs(altura) }
}

const RAIO = 4

/** Barra com a ponta arredondada só longe do zero */
function BarraDoSaldo(props: Retangulo & { fill?: string; payload?: { saldo: number } }) {
  const { x, topo, largura, altura } = caixa(props)
  if (altura === 0 || largura === 0) return null
  const r = Math.min(RAIO, altura, largura / 2)
  const base = topo + altura
  const d =
    (props.payload?.saldo ?? 0) >= 0
      ? `M${x},${base}V${topo + r}Q${x},${topo} ${x + r},${topo}H${x + largura - r}Q${x + largura},${topo} ${x + largura},${topo + r}V${base}Z`
      : `M${x},${topo}V${base - r}Q${x},${base} ${x + r},${base}H${x + largura - r}Q${x + largura},${base} ${x + largura},${base - r}V${topo}Z`
  return <path d={d} fill={props.fill} />
}

/** Rótulo com sinal: acima da barra positiva, abaixo da negativa */
function RotuloDoSaldo(props: Retangulo & { value?: unknown }) {
  const valor = Number(props.value ?? 0)
  const { x, topo, largura, altura } = caixa(props)
  const y = valor < 0 ? topo + altura + 14 : topo - 6
  return (
    <text
      x={x + largura / 2}
      y={y}
      textAnchor="middle"
      fontSize={11}
      fontWeight={800}
      fill="var(--foreground)"
      className="tabular-nums"
    >
      {formatarSaldoCurto(valor)}
    </text>
  )
}

function BalanceChart({ dados, carregando = false, ...props }: BalanceChartProps) {
  if (carregando) return <GraficoCarregando titulo="Saldo mensal" barras={4} {...props} />

  const linhas = dados.map((d) => ({ ...d, rotulo: mesAbreviado(d.mes) }))
  const marcas = marcasDoEixo(dados.map((d) => d.saldo))
  const ultimo = linhas.at(-1)?.rotulo

  return (
    <DashboardSecao
      data-slot="balance-chart"
      idTitulo="grafico-saldo-mensal"
      titulo="Saldo mensal"
      lado={formatarIntervaloMeses(dados)}
      {...props}
    >
      <figure aria-labelledby="grafico-saldo-mensal" className="flex flex-1 flex-col justify-center gap-3">
        <ChartContainer config={config} className="aspect-auto h-56 w-full md:h-52 lg:h-64">
          <BarChart
            data={linhas}
            margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="28%"
            accessibilityLayer={false}
          >
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
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval={0}
              tick={(tick: TickDoMes) => <MesDoEixo {...tick} ultimo={ultimo} />}
            />
            <ReferenceLine y={0} stroke="var(--input)" strokeWidth={1.5} />
            <Bar dataKey="saldo" shape={BarraDoSaldo} isAnimationActive={false}>
              {linhas.map((l) => (
                <Cell
                  key={`${l.ano}-${l.mes}`}
                  fill={l.saldo < 0 ? 'var(--despesa-grafico)' : 'var(--receita-grafico)'}
                />
              ))}
              <LabelList dataKey="saldo" content={RotuloDoSaldo} />
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="sr-only">
          <table>
            <caption>Saldo por mês, {intervaloPorExtenso(dados)}</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={`${d.ano}-${d.mes}`}>
                  <th scope="row">{mesPorExtenso(d.mes, d.ano)}</th>
                  <td>
                    {d.saldo < 0
                      ? `negativo, menos ${formatarMoeda(Math.abs(d.saldo))}`
                      : `positivo, ${formatarMoeda(d.saldo)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <figcaption className="text-legenda text-muted-foreground">Saldo = receitas − despesas de cada mês.</figcaption>
      </figure>
    </DashboardSecao>
  )
}

export { BalanceChart }
export type { BalanceChartProps }
