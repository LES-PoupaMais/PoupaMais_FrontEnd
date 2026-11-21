'use client'

import { ThemeProvider } from 'next-themes'
import { ErroGeralView } from './ErroGeralView'

// Erro no próprio layout raiz (app/global-error.tsx). O Next troca o layout inteiro por este arquivo, então os
// provedores do AppProviders não existem aqui: o tema (claro/escuro/sistema, a mesma escolha guardada pelo Perfil) volta
// pelo ThemeProvider só desta tela. Visual igual ao erro da área pública: ErrorState com "Tentar de novo" e "Voltar ao início".
export type ErroGlobalViewProps = { onTentarDeNovo: () => void }

export function ErroGlobalView({ onTentarDeNovo }: ErroGlobalViewProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ErroGeralView area="publica" onTentarDeNovo={onTentarDeNovo} />
    </ThemeProvider>
  )
}
