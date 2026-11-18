'use client'

import { createContext, useContext, type ReactNode } from 'react'

// PLACEHOLDER (B1): a landing de verdade é do B4 (pranchetas landing-*.dc.html). Aqui o Context só guarda o conteúdo
// estático, como exemplo vivo do padrão Context + View. Prometa só o que o sistema faz (DS: Voz e texto).
type Destaque = { titulo: string; texto: string }

type LandingContextValue = { destaques: Destaque[] }

const DESTAQUES: Destaque[] = [
  { titulo: 'Dashboard do mês', texto: 'Receitas, despesas, saldo e taxa de gasto de cada mês, com gráficos.' },
  { titulo: 'Importe e exporte', texto: 'Traga seus lançamentos de uma planilha CSV e exporte quando quiser.' },
  { titulo: 'Organize por categorias', texto: 'Um lançamento pode ter várias categorias, criadas por você.' },
]

const LandingContext = createContext<LandingContextValue | null>(null)

export function LandingProvider({ children }: { children: ReactNode }) {
  return <LandingContext.Provider value={{ destaques: DESTAQUES }}>{children}</LandingContext.Provider>
}

export function useLandingContext() {
  const contexto = useContext(LandingContext)
  if (!contexto) throw new Error('useLandingContext precisa estar dentro de <LandingProvider>')
  return contexto
}
