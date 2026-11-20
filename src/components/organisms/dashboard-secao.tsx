import type * as React from 'react'
import { Skeleton } from '@/components/atoms/skeleton'
import { cn } from '@/lib/cn'

// Card grande das seções do Dashboard (`.pm-card--grande` + `.pm-secao`): título em caixa alta (texto suave) e, à direita,
// o período ("Ago a Nov/2026") ou uma ação ("Ver todos"). A seção é nomeada pelo título (`aria-labelledby`).
// Usado pelos gráficos (IncomeExpenseChart, BalanceChart, CategoryBarChart) e por Maiores despesas.

type DashboardSecaoProps = Omit<React.ComponentProps<'section'>, 'title'> & {
  /** id do título (a seção e o gráfico apontam para ele) */
  idTitulo: string
  titulo: string
  /** À direita do título: período (texto) ou link */
  lado?: React.ReactNode
  /** Sem a superfície de card (Maiores despesas no celular desenha cada linha como card) */
  cartao?: 'sempre' | 'a-partir-do-tablet'
  /** Título só para leitor de tela (esqueleto: a prancheta dashboard-carregando não mostra o título) */
  tituloOculto?: boolean
}

const SUPERFICIE = 'rounded-grande border border-border bg-card text-card-foreground shadow-card p-6'
const SUPERFICIE_TABLET =
  'md:rounded-grande md:border md:border-border md:bg-card md:text-card-foreground md:shadow-card md:p-6'

function DashboardSecao({
  idTitulo,
  titulo,
  lado,
  cartao = 'sempre',
  tituloOculto = false,
  className,
  children,
  ...props
}: DashboardSecaoProps) {
  return (
    <section
      data-slot="dashboard-secao"
      aria-labelledby={idTitulo}
      className={cn('flex h-full min-w-0 flex-col', cartao === 'sempre' ? SUPERFICIE : SUPERFICIE_TABLET, className)}
      {...props}
    >
      <div className={cn('mb-3 flex min-h-5 items-center justify-between gap-3', tituloOculto && 'sr-only')}>
        <h2 id={idTitulo} className="text-rotulo-secao text-muted-foreground uppercase">
          {titulo}
        </h2>
        {typeof lado === 'string' ? <span className="text-legenda text-muted-foreground">{lado}</span> : lado}
      </div>
      {children}
    </section>
  )
}

type GraficoCarregandoProps = Omit<React.ComponentProps<'section'>, 'children'> & { titulo: string; barras: number }

const ALTURAS = ['h-[70%]', 'h-[55%]', 'h-[85%]', 'h-full'] as const

/** Esqueleto dos gráficos (DS Skeleton: título + barras de alturas variadas) */
function GraficoCarregando({ titulo, barras, className, ...props }: GraficoCarregandoProps) {
  return (
    <section
      data-slot="grafico-carregando"
      aria-hidden="true"
      className={cn('flex h-full flex-col gap-4', SUPERFICIE, className)}
      {...props}
    >
      <span className="sr-only">{titulo}</span>
      <Skeleton forma="texto" className="w-2/5" />
      <div className="flex h-40 items-end gap-3">
        {Array.from({ length: barras }, (_, i) => (
          <Skeleton key={i} className={cn('flex-1', ALTURAS[i % ALTURAS.length])} />
        ))}
      </div>
    </section>
  )
}

const LARGURAS = ['w-4/5', 'w-3/5', 'w-1/2', 'w-2/5'] as const

/** Esqueleto de lista com barras (Despesas por categoria, prancheta dashboard-carregando-celular): título + linhas */
function ListaCarregando({ titulo, barras, className, ...props }: GraficoCarregandoProps) {
  return (
    <section
      data-slot="lista-carregando"
      aria-hidden="true"
      className={cn('flex h-full flex-col gap-3', SUPERFICIE, className)}
      {...props}
    >
      <span className="sr-only">{titulo}</span>
      <Skeleton forma="texto" className="w-2/5" />
      {Array.from({ length: barras }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 pt-1">
          <Skeleton forma="texto" className="w-2/5" />
          <Skeleton forma="texto" className={LARGURAS[i % LARGURAS.length]} />
        </div>
      ))}
    </section>
  )
}

/** Props do tick do eixo X que o Recharts repassa (x e y podem vir como texto) */
type TickDoMes = { x?: number | string; y?: number | string; payload?: { value?: unknown } }

/** Mês do eixo X: 12px, negrito; o mês pedido (o último) em texto, os outros em texto suave */
function MesDoEixo({ x, y, payload, ultimo }: TickDoMes & { ultimo?: string }) {
  const valor = String(payload?.value ?? '')
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={10}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fill={valor === ultimo ? 'var(--foreground)' : 'var(--muted-foreground)'}
    >
      {valor}
    </text>
  )
}

/** Marca do eixo Y em uma linha só ("R$ 15 mil"): o texto padrão do Recharts quebra quando passa da largura do eixo */
function MarcaDoEixo({ x, y, payload, formatar }: TickDoMes & { formatar: (valor: number) => string }) {
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={4}
      textAnchor="end"
      fontSize={11}
      fontWeight={600}
      fill="var(--muted-foreground)"
      className="tabular-nums"
    >
      {formatar(Number(payload?.value ?? 0))}
    </text>
  )
}

export { DashboardSecao, GraficoCarregando, ListaCarregando, MarcaDoEixo, MesDoEixo }
export type { TickDoMes }
export type { DashboardSecaoProps }
