import { act, renderHook, waitFor } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { ErroApi } from '@/lib/http'
import { server } from '@/test/msw/server'
import { criarWrapper } from '@/test/utils'
import { useRecuperarSenha, useRedefinirSenha } from './use-recuperacao-senha'

describe('hooks de recuperação de senha (RN014)', () => {
  it('useRecuperarSenha envia o e-mail para /api/auth/recuperar-senha', async () => {
    let corpo: unknown
    server.use(
      msw.post('*/api/auth/recuperar-senha', async ({ request }) => {
        corpo = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { result } = renderHook(() => useRecuperarSenha(), { wrapper: criarWrapper().wrapper })

    act(() => result.current.mutate({ email: 'ana@x.com' }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(corpo).toEqual({ email: 'ana@x.com' })
  })

  it('useRedefinirSenha envia token e nova senha; 422 vira ErroApi', async () => {
    server.use(
      msw.post('*/api/auth/redefinir-senha', () =>
        HttpResponse.json({ status: 422, mensagem: 'Token expirado' }, { status: 422 }),
      ),
    )
    const { result } = renderHook(() => useRedefinirSenha(), { wrapper: criarWrapper().wrapper })

    act(() => result.current.mutate({ token: 'abc', novaSenha: '123456' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ErroApi)
    expect((result.current.error as ErroApi).status).toBe(422)
  })
})
