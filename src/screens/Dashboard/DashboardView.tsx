'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardTemplate } from '@/components/templates/dashboard-template'
import { formatarMesAno } from '@/lib/format'
import { useDashboardContext } from './DashboardContext'

// PLACEHOLDER (B1): só o cabeçalho com o mês da URL. Os organismos (highlight-card, stat-card, gráficos de área e
// barras, maiores despesas) e o month-navigator entram no B2/B4, seguindo dashboard-*.dc.html.
export function DashboardView() {
  const { periodo, mesAnterior, proximoMes } = useDashboardContext()
  return (
    <DashboardTemplate
      cabecalho={
        <>
          <h1 className="text-titulo-1">Dashboard</h1>
          <div role="group" aria-label="Mês exibido" className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={mesAnterior}
              className="rounded-pilula hover:bg-secondary inline-flex size-11 items-center justify-center"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <span className="text-corpo-forte min-w-36 text-center">{formatarMesAno(periodo.mes, periodo.ano)}</span>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={proximoMes}
              className="rounded-pilula hover:bg-secondary inline-flex size-11 items-center justify-center"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
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
