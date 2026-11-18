'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { destinoSeguro } from '@/lib/destino'

// PLACEHOLDER (B1): a tela de verdade é do B4 e segue o exemplo da skill `tela-next` (LoginForm + loginAction).
// Por enquanto o Context só resolve para onde ir depois de entrar (`/login?voltar=…`), já sem redirecionamento aberto.
type LoginContextValue = { voltarPara: string }

const LoginContext = createContext<LoginContextValue | null>(null)

export function LoginProvider({ voltar, children }: { voltar?: string | string[]; children: ReactNode }) {
  return <LoginContext.Provider value={{ voltarPara: destinoSeguro(voltar) }}>{children}</LoginContext.Provider>
}

export function useLoginContext() {
  const contexto = useContext(LoginContext)
  if (!contexto) throw new Error('useLoginContext precisa estar dentro de <LoginProvider>')
  return contexto
}
