'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useDashboard } from '@/hooks/use-dashboard'
import { TOAST_MODELO_CSV, useBaixarModeloCsv } from '@/hooks/use-exportacao'
import { useOnline } from '@/hooks/use-online'
import { useUsuario } from '@/hooks/use-usuario'
import { comPeriodo, lerPeriodo } from '@/lib/periodo'
import type { Dashboard, MesAno } from '@/types/api'

// Dashboard do mês da URL (?mes=11&ano=2026): dados de GET /dashboard (só lançamentos ATIVOS, RN003), estados da tela
// (carregando, vazio, erro, sem conexão) e a troca de mês. Gráficos, top 5 e peso das maiores vêm prontos da API (RN008).
type DashboardContextValue = {
  periodo: MesAno
  irParaMes: (periodo: MesAno) => void
  dashboard: Dashboard | undefined
  /** Primeira carga (sem dado nenhum na tela) */
  carregando: boolean
  /** Falhou e não há dado para mostrar */
  erro: boolean
  tentarDeNovo: () => void
  tentando: boolean
  /** Mês sem lançamentos que contam no saldo (receitas e despesas zeradas) */
  vazio: boolean
  online: boolean
  /** Primeiro nome para a saudação ("Olá, Leonardo") */
  primeiroNome: string | undefined
  /** "Baixar modelo CSV" do mês vazio (mesmo download de Lançamentos e Importar) */
  baixarModelo: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const periodo = lerPeriodo(parametros)
  const consulta = useDashboard(periodo)
  const { data: usuario } = useUsuario()
  const online = useOnline()
  const modelo = useBaixarModeloCsv()

  // replace (não push): trocar de mês não enche o histórico do Voltar; scroll false mantém a posição
  const irParaMes = (novo: MesAno) =>
    router.replace(`${caminho}?${comPeriodo(parametros.toString(), novo)}`, { scroll: false })

  const dashboard = consulta.data
  const valor: DashboardContextValue = {
    periodo,
    irParaMes,
    dashboard,
    carregando: consulta.isPending,
    erro: consulta.isError && !dashboard,
    tentarDeNovo: () => void consulta.refetch(),
    tentando: consulta.isFetching,
    vazio: Boolean(dashboard && dashboard.receitas === 0 && dashboard.despesas === 0),
    online,
    primeiroNome: usuario?.nome.trim().split(/\s+/)[0],
    baixarModelo: () =>
      modelo.mutate(undefined, {
        onSuccess: () => toast.success(TOAST_MODELO_CSV.sucesso),
        onError: () => toast.error(TOAST_MODELO_CSV.erro),
      }),
  }
  return <DashboardContext.Provider value={valor}>{children}</DashboardContext.Provider>
}

export function useDashboardContext() {
  const contexto = useContext(DashboardContext)
  if (!contexto) throw new Error('useDashboardContext precisa estar dentro de <DashboardProvider>')
  return contexto
}
