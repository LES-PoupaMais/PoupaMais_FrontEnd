import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErroApi } from '@/lib/http'
import { simularServiceWorker } from '@/test/service-worker'
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

    expect(screen.getByText('300000')).toBeInTheDocument()
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

  it('sessão vencida (401) pede ao service worker que apague os dados guardados antes de ir ao login', () => {
    const sw = simularServiceWorker()
    const assign = vi.fn(() => expect(sw.postMessage).toHaveBeenCalledWith({ tipo: 'limpar-dados' }, expect.any(Array)))
    vi.stubGlobal('location', { pathname: '/dashboard', search: '', assign })

    tratarNaoAutenticado(new ErroApi(500, 'Erro'))
    expect(sw.postMessage).not.toHaveBeenCalled()
    tratarNaoAutenticado(new ErroApi(401, 'Sessão expirada'))

    expect(assign).toHaveBeenCalledOnce()
    sw.desfazer()
  })

  it('consultas em offlineFirst: sem internet ainda tentam (o service worker responde com o que guardou)', async () => {
    const cliente = criarQueryClient()
    expect(cliente.getDefaultOptions().queries?.networkMode).toBe('offlineFirst')

    onlineManager.setOnline(false)
    try {
      const guardado = { saldo: 10 }
      await expect(cliente.fetchQuery({ queryKey: ['dashboard'], queryFn: async () => guardado })).resolves.toBe(
        guardado,
      )
    } finally {
      onlineManager.setOnline(true)
    }
  })

  it('o QueryClient trata o 401 das queries e das mutations', () => {
    const cliente = criarQueryClient()

    expect(cliente.getQueryCache().config.onError).toBe(tratarNaoAutenticado)
    expect(cliente.getMutationCache().config.onError).toBe(tratarNaoAutenticado)
  })

  it('cache: o dado vale 5 min e sai da memória 10 min depois de ninguém usar', () => {
    const opcoes = criarQueryClient().getDefaultOptions().queries
    expect(opcoes?.staleTime).toBe(5 * 60_000)
    expect(opcoes?.gcTime).toBe(10 * 60_000)
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
