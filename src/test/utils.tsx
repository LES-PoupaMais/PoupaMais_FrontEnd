import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'

// Renderiza com os providers da aplicação. QueryClient novo por teste e sem retry,
// para os erros aparecerem na hora e um teste não vazar cache para o outro.
export function renderComProviders(ui: ReactElement, opcoes?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const usuario = userEvent.setup()
  const resultado = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, opcoes)
  return { ...resultado, usuario, queryClient }
}
