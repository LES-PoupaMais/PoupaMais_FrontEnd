import { useQueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErroApi } from '@/lib/http'
import { AppProviders, criarQueryClient, deveRepetir, tratarNaoAutenticado } from './AppProviders'

describe('AppProviders', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('entrega o QueryClient para a aplicação', () => {
    function Consumidor() {
      const cliente = useQueryClient()
      return <p>{String(cliente.getDefaultOptions().queries?.staleTime)}</p>
    }
    render(
      <AppProviders>
        <Consumidor />
      </AppProviders>,
    )

    expect(screen.getByText('30000')).toBeInTheDocument()
  })

  it('sessão vencida (401) leva ao login guardando a página atual', () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { pathname: '/lancamentos', search: '?mes=11', assign })

    tratarNaoAutenticado(new ErroApi(401, 'Sessão expirada'))
    tratarNaoAutenticado(new ErroApi(500, 'Erro'))
    tratarNaoAutenticado(new Error('outro'))

    expect(assign).toHaveBeenCalledOnce()
    expect(assign).toHaveBeenCalledWith('/login?voltar=%2Flancamentos%3Fmes%3D11&sessao=vencida')
  })

  it('o QueryClient trata o 401 das queries e das mutations', () => {
    const cliente = criarQueryClient()

    expect(cliente.getQueryCache().config.onError).toBe(tratarNaoAutenticado)
    expect(cliente.getMutationCache().config.onError).toBe(tratarNaoAutenticado)
  })

  it('retry: não repete 4xx; repete uma vez rede e 5xx', () => {
    expect(criarQueryClient().getDefaultOptions().queries?.retry).toBe(deveRepetir)
    expect(deveRepetir(0, new ErroApi(404, 'x'))).toBe(false)
    expect(deveRepetir(0, new ErroApi(422, 'x'))).toBe(false)
    expect(deveRepetir(0, new ErroApi(0, 'x'))).toBe(true)
    expect(deveRepetir(0, new ErroApi(500, 'x'))).toBe(true)
    expect(deveRepetir(1, new ErroApi(500, 'x'))).toBe(false)
    expect(deveRepetir(0, new Error('x'))).toBe(true)
  })
})
