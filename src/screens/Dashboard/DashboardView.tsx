'use client'

import { MonthNavigator } from '@/components/molecules/month-navigator'
import { DashboardTemplate } from '@/components/templates/dashboard-template'
import { useDashboardContext } from './DashboardContext'

// PLACEHOLDER (B1): só o cabeçalho com o mês da URL (MonthNavigator). Os organismos (highlight-card, stat-card, gráficos
// de área e barras, maiores despesas) entram no B2/B4, seguindo dashboard-*.dc.html.
export function DashboardView() {
  const { periodo, irParaMes } = useDashboardContext()
  return (
    <DashboardTemplate
      cabecalho={
        <>
          <h1 className="text-titulo-1">Dashboard</h1>
          <MonthNavigator mes={periodo.mes} ano={periodo.ano} onChange={irParaMes} />
        </>
      }
      estado={
        <p className="text-corpo text-muted-foreground bg-card border-border rounded-card border p-6">
          Os cards e gráficos do mês entram na próxima etapa.
        </p>
      }
    />
  )
}
