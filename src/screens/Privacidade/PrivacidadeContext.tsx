'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { ROTAS } from '@/constants/rotas'

// Política de privacidade (pública). Conteúdo estático: o Context só entrega os destinos.
type PrivacidadeContextValue = { hrefInicio: string; hrefLogin: string }

const PrivacidadeContext = createContext<PrivacidadeContextValue | null>(null)
const VALOR: PrivacidadeContextValue = { hrefInicio: ROTAS.inicio, hrefLogin: ROTAS.login }

export function PrivacidadeProvider({ children }: { children: ReactNode }) {
  return <PrivacidadeContext.Provider value={VALOR}>{children}</PrivacidadeContext.Provider>
}

export function usePrivacidadeContext() {
  const contexto = useContext(PrivacidadeContext)
  if (!contexto) throw new Error('usePrivacidadeContext precisa estar dentro de <PrivacidadeProvider>')
  return contexto
}
