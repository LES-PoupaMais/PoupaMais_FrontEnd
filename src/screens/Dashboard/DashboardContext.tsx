'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, type ReactNode } from 'react'
import { comPeriodo, lerPeriodo } from '@/lib/periodo'
import type { MesAno } from '@/types/api'

// PLACEHOLDER (B1): mostra o padrão do filtro de mês NA URL (lê e escreve com useSearchParams/useRouter).
// O B4 acrescenta aqui os dados (useDashboard(periodo)), os estados (carregando, vazio, erro, sem conexão) e as ações.
type DashboardContextValue = {
  periodo: MesAno
  irParaMes: (periodo: MesAno) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const periodo = lerPeriodo(parametros)

  // replace (não push): trocar de mês não enche o histórico do Voltar; scroll false mantém a posição
  const irParaMes = (novo: MesAno) =>
    router.replace(`${caminho}?${comPeriodo(parametros.toString(), novo)}`, { scroll: false })

  const valor: DashboardContextValue = {
    periodo,
    irParaMes,
  }
  return <DashboardContext.Provider value={valor}>{children}</DashboardContext.Provider>
}

export function useDashboardContext() {
  const contexto = useContext(DashboardContext)
  if (!contexto) throw new Error('useDashboardContext precisa estar dentro de <DashboardProvider>')
  return contexto
}
