import { act, renderHook } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'
import { criarWrapper } from '@/test/utils'
import { useImportarCsv } from './use-importacao'
import { useAlterarStatusCategoria, useExcluirCategoria } from './use-mutacoes-categoria'

const familias = (invalidar: { mock: { calls: unknown[][] } }) =>
  invalidar.mock.calls.map(([filtros]) => (filtros as { queryKey: readonly unknown[] }).queryKey[0]).sort()

describe('hooks de importação e de categoria', () => {
  it('useImportarCsv envia o arquivo, devolve o resultado e invalida lista, dashboard e categorias', async () => {
    const resultado = { totalLinhas: 2, importados: 1, falhas: [], categoriasCriadas: ['Pet'] }
    server.use(msw.post('*/api/lancamentos/importar', () => HttpResponse.json(resultado)))
    const { wrapper, queryClient } = criarWrapper()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useImportarCsv(), { wrapper })

    const resposta = await act(() => result.current.mutateAsync(new File(['a'], 'a.csv', { type: 'text/csv' })))

    expect(resposta).toEqual(resultado)
    expect(familias(invalidar)).toEqual(['categorias', 'dashboard', 'lancamentos'])
  })

  it.each([
    ['inativar', () => useAlterarStatusCategoria(), { id: 2, ativa: false }, 'patch', '/categorias/2/status'],
    ['excluir', () => useExcluirCategoria(), 2, 'delete', '/categorias/2'],
  ] as const)('%s categoria chama a API e invalida', async (_nome, hook, variaveis, metodo, caminho) => {
    let chamou = false
    server.use(
      msw[metodo](`*/api${caminho}`, () => {
        chamou = true
        return metodo === 'delete' ? new HttpResponse(null, { status: 204 }) : HttpResponse.json({ id: 2 })
      }),
    )
    const { wrapper, queryClient } = criarWrapper()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(hook as () => { mutateAsync: (v: unknown) => Promise<unknown> }, { wrapper })

    await act(() => result.current.mutateAsync(variaveis))

    expect(chamou).toBe(true)
    expect(familias(invalidar)).toEqual(['categorias', 'dashboard', 'lancamentos'])
  })
})
