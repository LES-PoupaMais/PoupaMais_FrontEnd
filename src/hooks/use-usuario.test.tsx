import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { queryKeys } from '@/constants/query-keys'
import { criarWrapper } from '@/test/utils'
import { useUsuario } from './use-usuario'

const usuario = { id: 1, nome: 'Leonardo Silva', email: 'l@x.com', possuiFoto: false, dataCadastro: '2026-08-01' }

function Nome() {
  const { data, isPending } = useUsuario()
  return <span>{isPending ? 'carregando' : data?.nome}</span>
}

describe('useUsuario', () => {
  it('no servidor (e na hidratação) devolve "carregando", mesmo com o usuário no cache', () => {
    const cliente = new QueryClient()
    cliente.setQueryData(queryKeys.usuario.eu, usuario)

    const html = renderToString(
      <QueryClientProvider client={cliente}>
        <Nome />
      </QueryClientProvider>,
    )

    expect(html).toContain('carregando')
    expect(html).not.toContain('Leonardo')
  })

  it('no navegador, depois de montar, traz o usuário', async () => {
    const { result } = renderHook(() => useUsuario(), { wrapper: criarWrapper().wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nome).toBeTruthy()
  })
})
