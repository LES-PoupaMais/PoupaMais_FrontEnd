'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/atoms/sonner'
import { TooltipProvider } from '@/components/atoms/tooltip'
import { ErroApi } from '@/lib/http'

// Sessão vencida (401 vindo do BFF): volta para o login de qualquer tela, guardando o destino.
export function tratarNaoAutenticado(erro: unknown) {
  if (erro instanceof ErroApi && erro.status === 401) {
    const voltar = encodeURIComponent(window.location.pathname + window.location.search)
    // Navegação completa de propósito: descarta o cache e o estado da sessão vencida (fora do React, sem useRouter)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?voltar=${voltar}`)
  }
}

export function criarQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: tratarNaoAutenticado }),
    mutationCache: new MutationCache({ onError: tratarNaoAutenticado }),
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  })
}

/**
 * Providers da aplicação inteira, usados só pelo `app/layout.tsx`:
 * tema (next-themes, classe `dark` no <html>, padrão = sistema), TanStack Query, tooltips e toasts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(criarQueryClient)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
        {/* Toast: 5 s, embaixo à direita no computador e acima da barra inferior no celular (DS, Toast) */}
        <Toaster
          position="bottom-right"
          duration={5000}
          mobileOffset={{ bottom: 'calc(var(--barra-inferior) + env(safe-area-inset-bottom) + 16px)' }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
