import type { ReactNode } from 'react'
import { StatCard, StatCardGrade } from '@/components/molecules/stat-card'
import { BalanceChart } from '@/components/organisms/balance-chart'
import { CategoryBarChart } from '@/components/organisms/category-bar-chart'
import { HighlightCard } from '@/components/organisms/highlight-card'
import { IncomeExpenseChart } from '@/components/organisms/income-expense-chart'
import { MaioresDespesas } from '@/components/organisms/maiores-despesas'
import { DashboardTemplate, type DashboardTemplateProps } from '@/components/templates/dashboard-template'

// Carregando (prancheta dashboard-carregando-celular): esqueletos com as medidas reais de cada bloco, na mesma grade.
// A View usa os mesmos slots na primeira carga (o template não remonta quando os dados chegam: o MonthNavigator mantém o foco).
export const esqueletosDoDashboard: DashboardTemplateProps = {
  saldo: <HighlightCard saldo={0} mes={1} ano={2026} carregando className="h-full" />,
  indicadores: (
    <StatCardGrade aria-label="Resumo do mês" carregando className="col-span-full h-full gap-4 lg:gap-5">
      <StatCard rotulo="Receitas" carregando />
      <StatCard rotulo="Despesas" carregando />
      <StatCard rotulo="Taxa de gasto" carregando className="col-span-full" />
    </StatCardGrade>
  ),
  receitasDespesas: <IncomeExpenseChart dados={[]} carregando />,
  saldoMensal: <BalanceChart dados={[]} carregando />,
  categorias: <CategoryBarChart dados={[]} total={0} mes={1} ano={2026} carregando />,
  maioresDespesas: (
    <MaioresDespesas itens={[]} peso={{ valor: 0, percentual: null }} totalDespesas={0} mes={1} ano={2026} carregando />
  ),
}

/** Fallback do <Suspense> da rota */
export function DashboardSkeleton({ cabecalho }: { cabecalho?: ReactNode }) {
  return <DashboardTemplate cabecalho={cabecalho} {...esqueletosDoDashboard} />
}
