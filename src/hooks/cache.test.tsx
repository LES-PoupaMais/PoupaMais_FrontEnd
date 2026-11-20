import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarQueryClient } from '@/screens/App/AppProviders'
import { server } from '@/test/msw/server-e-dados'
import { useDashboard } from './use-dashboard'
import { useLancamentos } from './use-lancamentos'
import { useSalvarLancamento } from './use-mutacoes-lancamento'

// Cache das consultas com o QueryClient de verdade da aplicação (staleTime de 5 min, invalidação por lib/invalidacoes)

let requisicoes: string[] = []
const contar = ({ request }: { request: Request }) => {
  const url = new URL(request.url)
  requisicoes.push(`${request.method} ${url.pathname}`)
}
const quantas = (chamada: string) => requisicoes.filter((r) => r === chamada).length

function criarWrapperDaAplicacao() {
  const queryClient = criarQueryClient()
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { wrapper: Wrapper, queryClient }
}

describe('cache das consultas', () => {
  beforeEach(() => {
    requisicoes = []
    server.events.on('request:start', contar)
  })
  afterEach(() => server.events.removeListener('request:start', contar))

  it('o mesmo filtro duas vezes faz uma requisição só', async () => {
    const { wrapper, queryClient } = criarWrapperDaAplicacao()
    const filtro = { mes: 11, ano: 2026, descricao: 'mer' }

    const primeira = renderHook(() => useLancamentos(filtro), { wrapper })
    await waitFor(() => expect(primeira.result.current.isSuccess).toBe(true))
    primeira.unmount()

    const segunda = renderHook(() => useLancamentos({ ...filtro }), { wrapper })
    expect(segunda.result.current.isSuccess).toBe(true)
    expect(quantas('GET /api/lancamentos')).toBe(1)
    queryClient.clear()
  })

  it('uma mutação recarrega as chaves afetadas', async () => {
    server.use(http.post('*/api/lancamentos', () => HttpResponse.json({ id: 9 }, { status: 201 })))
    const { wrapper, queryClient } = criarWrapperDaAplicacao()
    const periodo = { mes: 11, ano: 2026 }
    const { result } = renderHook(
      () => ({ lista: useLancamentos(periodo), dashboard: useDashboard(periodo), salvar: useSalvarLancamento() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.lista.isSuccess && result.current.dashboard.isSuccess).toBe(true))
    expect(quantas('GET /api/lancamentos')).toBe(1)
    expect(quantas('GET /api/dashboard')).toBe(1)

    await act(() =>
      result.current.salvar.mutateAsync({
        descricao: 'Salário',
        tipo: 'RECEITA',
        data: '2026-11-05',
        valor: 9800,
        categoriaIds: [3],
      }),
    )

    await waitFor(() => expect(quantas('GET /api/lancamentos')).toBe(2))
    expect(quantas('GET /api/dashboard')).toBe(2)
    queryClient.clear()
  })
})
