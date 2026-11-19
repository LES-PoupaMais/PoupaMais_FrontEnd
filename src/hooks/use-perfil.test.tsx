import { act, renderHook, waitFor } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/constants/query-keys'
import { http } from '@/lib/http'
import { server, usuarioDemo } from '@/test/msw/server-e-dados'
import { criarWrapper } from '@/test/utils'
import type { Usuario } from '@/types/api'
import { useUsuario } from './use-usuario'
import { useAtualizarNome, useBaixarMeusDados, useRemoverFoto, useTrocarFoto } from './use-perfil'

describe('hooks do perfil', () => {
  it('useAtualizarNome grava o perfil devolvido no cache do usuário', async () => {
    server.use(
      msw.put('*/api/usuarios/me', async ({ request }) =>
        HttpResponse.json({ ...usuarioDemo, ...((await request.json()) as object) }),
      ),
    )
    const { wrapper, queryClient } = criarWrapper()
    const { result } = renderHook(() => useAtualizarNome(), { wrapper })

    await act(() => result.current.mutateAsync({ nome: 'Leonardo Nascimento' }))
    expect(queryClient.getQueryData<Usuario>(queryKeys.usuario.eu)?.nome).toBe('Leonardo Nascimento')
  })

  it('trocar e remover a foto marcam possuiFoto e recarregam o usuário (nova versão da URL)', async () => {
    // o MSW no jsdom não lê FormData: confere o envio pelo http.put
    let possuiFoto = false
    const put = vi.spyOn(http, 'put').mockImplementation(async () => {
      possuiFoto = true
      return undefined
    })
    server.use(
      msw.get('*/api/usuarios/me', () => HttpResponse.json({ ...usuarioDemo, possuiFoto })),
      msw.delete('*/api/usuarios/me/foto', () => {
        possuiFoto = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { wrapper } = criarWrapper()
    const { result } = renderHook(
      () => ({ usuario: useUsuario(), trocar: useTrocarFoto(), remover: useRemoverFoto() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.usuario.isSuccess).toBe(true))
    const versaoInicial = result.current.usuario.dataUpdatedAt

    await act(() => result.current.trocar.mutateAsync(new File(['x'], 'eu.png', { type: 'image/png' })))
    expect(put).toHaveBeenCalledWith('/usuarios/me/foto', { corpo: expect.any(FormData) })
    await waitFor(() => expect(result.current.usuario.data?.possuiFoto).toBe(true))
    expect(result.current.usuario.dataUpdatedAt).toBeGreaterThanOrEqual(versaoInicial)

    await act(() => result.current.remover.mutateAsync())
    await waitFor(() => expect(result.current.usuario.data?.possuiFoto).toBe(false))
    put.mockRestore()
  })

  it('useBaixarMeusDados devolve o arquivo com o nome do Content-Disposition', async () => {
    server.use(
      msw.get(
        '*/api/usuarios/me/dados',
        () =>
          new HttpResponse('{"perfil":{}}', {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="meus-dados-poupamais.json"',
            },
          }),
      ),
    )
    const { wrapper } = criarWrapper()
    const { result } = renderHook(() => useBaixarMeusDados(), { wrapper })

    const arquivo = await act(() => result.current.mutateAsync())
    expect(arquivo.nomeArquivo).toBe('meus-dados-poupamais.json')
  })
})
