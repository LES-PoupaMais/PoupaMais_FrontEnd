import { act, renderHook, waitFor } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server-e-dados'
import { criarWrapper } from '@/test/utils'
import { useFilaDaLixeira, useMoverParaLixeiraAdiado } from './use-lixeira-adiada'

function usar() {
  const { wrapper, queryClient } = criarWrapper()
  const resultado = renderHook(() => ({ fila: useFilaDaLixeira(), ...useMoverParaLixeiraAdiado() }), { wrapper })
  return { ...resultado, queryClient }
}

describe('useMoverParaLixeiraAdiado', () => {
  it('adiar esconde, desfazer traz de volta sem chamar a API', async () => {
    const excluir = vi.fn()
    server.use(msw.delete('*/api/lancamentos/:id', () => (excluir(), new HttpResponse(null, { status: 204 }))))
    const { result } = usar()
    act(() => result.current.adiar(1))
    expect(result.current.fila.has(1)).toBe(true)
    act(() => result.current.desfazer(1))
    expect(result.current.fila.has(1)).toBe(false)
    await act(() => result.current.confirmar(1))
    expect(excluir).not.toHaveBeenCalled()
  })

  it('confirmar envia o DELETE uma vez, invalida e tira da fila', async () => {
    const excluir = vi.fn()
    server.use(
      msw.delete(
        '*/api/lancamentos/:id',
        ({ params }) => (excluir(params.id), new HttpResponse(null, { status: 204 })),
      ),
    )
    const { result, queryClient } = usar()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    act(() => result.current.adiar(2))
    await act(() => Promise.all([result.current.confirmar(2), result.current.confirmar(2)]))
    expect(excluir).toHaveBeenCalledTimes(1)
    expect(excluir).toHaveBeenCalledWith('2')
    expect(invalidar).toHaveBeenCalled()
    expect(result.current.fila.has(2)).toBe(false)
  })

  it('erro no DELETE: a linha volta e a Promise rejeita', async () => {
    server.use(
      msw.delete('*/api/lancamentos/:id', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })),
    )
    const { result } = usar()
    act(() => result.current.adiar(3))
    await act(() => expect(result.current.confirmar(3)).rejects.toThrow())
    expect(result.current.fila.has(3)).toBe(false)
  })

  it('ao sair da página (pagehide) envia o que estava esperando', async () => {
    const excluir = vi.fn()
    server.use(msw.delete('*/api/lancamentos/:id', () => (excluir(), new HttpResponse(null, { status: 204 }))))
    const { result } = usar()
    act(() => result.current.adiar(4))
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    await waitFor(() => expect(excluir).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.fila.has(4)).toBe(false))
  })
})
