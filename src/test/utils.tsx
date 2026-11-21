import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'

// QueryClient novo por teste e sem retry, para os erros aparecerem na hora e um teste não vazar cache para o outro.
export function criarQueryClientDeTeste() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}

/** Renderiza com os providers da aplicação (componentes e telas). */
export function renderComProviders(ui: ReactElement, opcoes?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = criarQueryClientDeTeste()
  const usuario = userEvent.setup()
  const resultado = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, opcoes)
  return { ...resultado, usuario, queryClient }
}

/** Wrapper para `renderHook` dos hooks globais (TanStack Query). */
export function criarWrapper() {
  const queryClient = criarQueryClientDeTeste()
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { wrapper: Wrapper, queryClient }
}
