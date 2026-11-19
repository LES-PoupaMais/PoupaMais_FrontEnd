import type { InfiniteData } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/constants/query-keys'
import { lancamentosDemo, paginar, server } from '@/test/msw/server-e-dados'
import { criarWrapper } from '@/test/utils'
import type { Lancamento, Pagina } from '@/types/api'
import { useMoverParaLixeiraComDesfazer } from './use-lixeira'

const chaveDaLista = queryKeys.lancamentos.lista({ mes: 11, ano: 2026, tamanho: 12 })

function usar() {
  const { wrapper, queryClient } = criarWrapper()
  const ativos = lancamentosDemo.filter((l) => l.status !== 'DELETADO') as Lancamento[]
  queryClient.setQueryData<InfiniteData<Pagina<Lancamento>, number>>(chaveDaLista, {
    pages: [paginar(ativos)],
    pageParams: [0],
  })
  const { result } = renderHook(() => useMoverParaLixeiraComDesfazer(), { wrapper })
  return { mover: result.current, queryClient, ativos }
}

const idsDaLista = (queryClient: ReturnType<typeof criarWrapper>['queryClient']) =>
  queryClient
    .getQueryData<InfiniteData<Pagina<Lancamento>, number>>(chaveDaLista)
    ?.pages.flatMap((p) => p.itens.map((l) => l.id))

describe('useMoverParaLixeiraComDesfazer', () => {
  it('envia o DELETE na hora, tira a linha das listas e invalida lista, dashboard e lixeira', async () => {
    const excluir = vi.fn()
    server.use(
      msw.delete(
        '*/api/lancamentos/:id',
        ({ params }) => (excluir(params.id), new HttpResponse(null, { status: 204 })),
      ),
    )
    const { mover, queryClient, ativos } = usar()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')

    let movido!: ReturnType<typeof mover>
    act(() => {
      movido = mover(2)
    })
    expect(idsDaLista(queryClient)).not.toContain(2)
    const pagina = queryClient.getQueryData<InfiniteData<Pagina<Lancamento>, number>>(chaveDaLista)?.pages[0]
    expect(pagina?.total).toBe(ativos.length - 1)
    await act(() => movido.envio)
    expect(excluir).toHaveBeenCalledWith('2')
    expect(invalidar).toHaveBeenCalledWith({ queryKey: queryKeys.lancamentos.todos })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.todos })
  })

  it('Desfazer espera o DELETE e chama o restaurar uma vez só', async () => {
    const chamadas: string[] = []
    server.use(
      msw.delete('*/api/lancamentos/:id', async () => {
        await new Promise((r) => setTimeout(r, 20))
        chamadas.push('DELETE')
        return new HttpResponse(null, { status: 204 })
      }),
      msw.post('*/api/lancamentos/:id/restaurar', () => {
        chamadas.push('restaurar')
        return HttpResponse.json({ ...lancamentosDemo[0], status: 'ATIVO' })
      }),
    )
    const { mover } = usar()
    let movido!: ReturnType<typeof mover>
    act(() => {
      movido = mover(1)
    })
    await act(() => Promise.all([movido.desfazer(), movido.desfazer()]))
    expect(chamadas).toEqual(['DELETE', 'restaurar'])
  })

  it('erro no DELETE: avisa, recarrega e o Desfazer não restaura', async () => {
    const restaurar = vi.fn()
    server.use(
      msw.delete('*/api/lancamentos/:id', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })),
      msw.post('*/api/lancamentos/:id/restaurar', () => (restaurar(), HttpResponse.json(lancamentosDemo[0]))),
    )
    const onErroAoMover = vi.fn()
    const { mover, queryClient } = usar()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    let movido!: ReturnType<typeof mover>
    act(() => {
      movido = mover(3, { onErroAoMover })
    })
    await act(() => expect(movido.envio).rejects.toThrow())
    expect(onErroAoMover).toHaveBeenCalledTimes(1)
    expect(invalidar).toHaveBeenCalledWith({ queryKey: queryKeys.lancamentos.todos })
    await act(() => movido.desfazer())
    expect(restaurar).not.toHaveBeenCalled()
  })

  it('erro no restaurar: avisa e recarrega as listas', async () => {
    server.use(
      msw.delete('*/api/lancamentos/:id', () => new HttpResponse(null, { status: 204 })),
      msw.post('*/api/lancamentos/:id/restaurar', () =>
        HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }),
      ),
    )
    const onErroAoDesfazer = vi.fn()
    const { mover, queryClient } = usar()
    let movido!: ReturnType<typeof mover>
    act(() => {
      movido = mover(4, { onErroAoDesfazer })
    })
    await act(() => movido.envio)
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    await act(() => movido.desfazer())
    expect(onErroAoDesfazer).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: queryKeys.lancamentos.todos }))
  })
})
