import { act, renderHook, waitFor } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/constants/query-keys'
import { lancamentosDemo, server } from '@/test/msw/server-e-dados'
import { criarWrapper } from '@/test/utils'
import { useCategorias, useSalvarCategoria } from './use-categorias'
import { useDashboard } from './use-dashboard'
import { useLancamento, useLancamentos } from './use-lancamentos'
import {
  useAlterarStatusLancamento,
  useMoverParaLixeira,
  useRestaurarLancamento,
  useSalvarLancamento,
} from './use-mutacoes-lancamento'
import { useUsuario } from './use-usuario'

describe('hooks de leitura', () => {
  it('useLancamentos junta as páginas e sabe quando há mais ("Mostrar mais")', async () => {
    const { wrapper } = criarWrapper()
    const { result } = renderHook(() => useLancamentos({ mes: 11, ano: 2026 }, { tamanho: 2 }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.itens.map((l) => l.id)).toEqual([5, 4])
    expect(result.current.data?.total).toBe(lancamentosDemo.length)
    expect(result.current.hasNextPage).toBe(true)

    await act(() => result.current.fetchNextPage())
    await act(() => result.current.fetchNextPage())

    await waitFor(() => expect(result.current.data?.itens).toHaveLength(5))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('useLancamento só busca com id', async () => {
    const { wrapper } = criarWrapper()
    const semId = renderHook(() => useLancamento(undefined), { wrapper })
    expect(semId.result.current.fetchStatus).toBe('idle')

    const comId = renderHook(() => useLancamento(3), { wrapper })
    await waitFor(() => expect(comId.result.current.data?.descricao).toBe('Mercado do mês'))
  })

  it('useDashboard, useCategorias e useUsuario trazem os dados do BFF', async () => {
    const { wrapper } = criarWrapper()
    const dashboard = renderHook(() => useDashboard({ mes: 9, ano: 2026 }), { wrapper })
    const categorias = renderHook(() => useCategorias({ mes: 11, ano: 2026 }), { wrapper })
    const usuario = renderHook(() => useUsuario(), { wrapper })

    await waitFor(() => expect(dashboard.result.current.data?.mes).toBe(9))
    expect(dashboard.result.current.data?.pesoMaioresDespesas.percentual).toBe(64.73)
    await waitFor(() => expect(categorias.result.current.data?.[0].quantidadeLancamentos).toBe(1))
    await waitFor(() => expect(usuario.result.current.data?.nome).toBe('Usuário Demo'))
  })
})

describe('mutations invalidam lista, dashboard e categorias', () => {
  const familiasInvalidadas = (invalidar: ReturnType<typeof vi.fn>) =>
    invalidar.mock.calls.map(([filtros]) => (filtros as { queryKey: readonly unknown[] }).queryKey[0]).sort()

  const lancamento = {
    descricao: 'Salário',
    tipo: 'RECEITA' as const,
    data: '2026-11-05',
    valor: 9800,
    categoriaIds: [3],
  }

  it.each([
    ['criar lançamento', () => useSalvarLancamento(), lancamento, 'post', '/lancamentos'],
    ['editar lançamento', () => useSalvarLancamento(), { id: 3, ...lancamento }, 'put', '/lancamentos/3'],
    [
      'Conta no saldo',
      () => useAlterarStatusLancamento(),
      { id: 3, status: 'INATIVO' },
      'patch',
      '/lancamentos/3/status',
    ],
    ['mover para a lixeira', () => useMoverParaLixeira(), 3, 'delete', '/lancamentos/3'],
    ['restaurar', () => useRestaurarLancamento(), 3, 'post', '/lancamentos/3/restaurar'],
    ['criar categoria', () => useSalvarCategoria(), { descricao: 'Pet' }, 'post', '/categorias'],
    ['renomear categoria', () => useSalvarCategoria(), { id: 1, descricao: 'Moradia' }, 'put', '/categorias/1'],
  ] as const)('%s', async (_nome, hook, variaveis, metodo, caminho) => {
    let chamou = false
    server.use(
      msw[metodo](`*/api${caminho}`, () => {
        chamou = true
        return HttpResponse.json({ id: 3 })
      }),
    )
    const { wrapper, queryClient } = criarWrapper()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    // cada hook tem suas variáveis; a tabela acima garante o par certo
    const { result } = renderHook(hook as () => { mutateAsync: (v: unknown) => Promise<unknown> }, { wrapper })

    await act(() => result.current.mutateAsync(variaveis))

    expect(chamou).toBe(true)
    expect(familiasInvalidadas(invalidar as unknown as ReturnType<typeof vi.fn>)).toEqual([
      queryKeys.categorias.todas[0],
      queryKeys.dashboard.todos[0],
      queryKeys.lancamentos.todos[0],
    ])
  })
})
