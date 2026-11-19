'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { ROTAS } from '@/constants/rotas'

// Landing (pranchetas landing-celular e landing-computador). Conteúdo estático: o Context só entrega os destinos.
type LandingContextValue = { hrefCadastro: string; hrefLogin: string; hrefPrivacidade: string }

const LandingContext = createContext<LandingContextValue | null>(null)

const VALOR: LandingContextValue = {
  hrefCadastro: ROTAS.cadastro,
  hrefLogin: ROTAS.login,
  hrefPrivacidade: ROTAS.privacidade,
}

export function LandingProvider({ children }: { children: ReactNode }) {
  return <LandingContext.Provider value={VALOR}>{children}</LandingContext.Provider>
}

export function useLandingContext() {
  const contexto = useContext(LandingContext)
  if (!contexto) throw new Error('useLandingContext precisa estar dentro de <LandingProvider>')
  return contexto
}
