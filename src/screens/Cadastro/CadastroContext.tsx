'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { ROTAS } from '@/constants/rotas'

// PLACEHOLDER (B1): a tela de verdade (cadastro-form + cadastroAction) é do B4.
type CadastroContextValue = { linkPrivacidade: string }

const CadastroContext = createContext<CadastroContextValue | null>(null)

export function CadastroProvider({ children }: { children: ReactNode }) {
  return <CadastroContext.Provider value={{ linkPrivacidade: ROTAS.privacidade }}>{children}</CadastroContext.Provider>
}

export function useCadastroContext() {
  const contexto = useContext(CadastroContext)
  if (!contexto) throw new Error('useCadastroContext precisa estar dentro de <CadastroProvider>')
  return contexto
}
