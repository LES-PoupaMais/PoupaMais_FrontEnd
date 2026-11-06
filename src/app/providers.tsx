'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/atoms/sonner'
import { TooltipProvider } from '@/components/atoms/tooltip'
import { ErroApi } from '@/lib/http'

// Sessão expirada (401 vindo do BFF): volta para o login de qualquer tela
function tratarNaoAutenticado(erro: unknown) {
  if (erro instanceof ErroApi && erro.status === 401) {
    // Navegação completa de propósito: descarta o cache e o estado da sessão expirada (fora do React, sem useRouter)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/login')
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: tratarNaoAutenticado }),
        mutationCache: new MutationCache({ onError: tratarNaoAutenticado }),
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
