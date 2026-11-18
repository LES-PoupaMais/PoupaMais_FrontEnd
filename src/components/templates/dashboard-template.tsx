import type { ReactNode } from 'react'

// Grade do Dashboard (DS: Gráficos; MUDANCAS_RODADA2 §5), dentro do AppShellTemplate.
// - Computador (≥ 1024px), 12 colunas: Saldo (4) + indicadores (8) · Receitas × Despesas (8) + Saldo mensal (4) ·
//   Despesas por categoria (6) + Maiores despesas (6), com a mesma altura na linha.
// - Tablet (768–1023px): 2 colunas equilibradas.
// - Celular: 1 coluna, nesta ordem: saldo, indicadores, área, saldo mensal, categorias, maiores despesas.
// O `cabecalho` (título + MonthNavigator) só aparece a partir de 768px: no celular, título e mês ficam na TopBar.
// Pranchetas: ../Documentação/design/telas/project/dashboard-*.dc.html.
export type DashboardTemplateProps = {
  /** Título da tela + MonthNavigator (≥ 768px) */
  cabecalho?: ReactNode
  /** Faixas no topo (OfflineBanner, ActionBanner), largura toda */
  aviso?: ReactNode
  /** HighlightCard "Saldo do mês" */
  saldo?: ReactNode
  /** StatCards Receitas, Despesas e Taxa de gasto (filhos diretos da grade de tiles) */
  indicadores?: ReactNode
  /** IncomeExpenseChart (área) */
  receitasDespesas?: ReactNode
  /** BalanceChart (barras verticais) */
  saldoMensal?: ReactNode
  /** CategoryBarChart (barras horizontais) */
  categorias?: ReactNode
  /** Lista das 5 maiores despesas */
  maioresDespesas?: ReactNode
  /** Substitui a grade inteira: EmptyState (mês sem lançamentos) ou ErrorState */
  estado?: ReactNode
}

export function DashboardTemplate({
  cabecalho,
  aviso,
  saldo,
  indicadores,
  receitasDespesas,
  saldoMensal,
  categorias,
  maioresDespesas,
  estado,
}: DashboardTemplateProps) {
  return (
    <div data-slot="dashboard-template" className="flex flex-col gap-6">
      {cabecalho && (
        <div data-slot="dashboard-cabecalho" className="hidden flex-wrap items-center justify-between gap-4 md:flex">
          {cabecalho}
        </div>
      )}
      {aviso && <div data-slot="dashboard-aviso">{aviso}</div>}
      {estado ? (
        <div data-slot="dashboard-estado">{estado}</div>
      ) : (
        <div data-slot="dashboard-grade" className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-12">
          <Celula slot="saldo" className="lg:col-span-4">
            {saldo}
          </Celula>
          <Celula slot="indicadores" className="grid grid-cols-2 gap-4 lg:col-span-8 lg:grid-cols-3 lg:gap-6">
            {indicadores}
          </Celula>
          <Celula slot="receitas-despesas" className="lg:col-span-8">
            {receitasDespesas}
          </Celula>
          <Celula slot="saldo-mensal" className="lg:col-span-4">
            {saldoMensal}
          </Celula>
          <Celula slot="categorias" className="lg:col-span-6">
            {categorias}
          </Celula>
          <Celula slot="maiores-despesas" className="lg:col-span-6">
            {maioresDespesas}
          </Celula>
        </div>
      )}
    </div>
  )
}

function Celula({ slot, className, children }: { slot: string; className: string; children: ReactNode }) {
  if (!children) return null
  return (
    <div data-slot={`dashboard-${slot}`} className={`min-w-0 ${className}`}>
      {children}
    </div>
  )
}
