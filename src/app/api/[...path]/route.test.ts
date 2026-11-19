// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loja = vi.hoisted(() => ({ get: vi.fn(), delete: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => loja }))

const { GET, POST } = await import('./route')

const chamar = (handler: typeof GET, caminho: string[], metodo = 'GET') =>
  handler(new NextRequest(`http://localhost:3000/api/${caminho.join('/')}?mes=11`, { method: metodo }), {
    params: Promise.resolve({ path: caminho }),
  })

describe('BFF /api/[...path]', () => {
  const fetchFalso = vi.fn()
  beforeEach(() => {
    loja.get.mockReturnValue({ value: 'token-falso' })
    fetchFalso.mockResolvedValue(Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetchFalso)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('repassa rota permitida com o token e a query', async () => {
    const resposta = await chamar(GET, ['lancamentos', '3'])
    expect(resposta.status).toBe(200)
    const [destino, opcoes] = fetchFalso.mock.calls[0] as [URL, RequestInit]
    expect(destino.toString()).toBe('http://localhost:8080/api/lancamentos/3?mes=11')
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer token-falso')
  })

  it.each([
    [['auth', 'login']],
    [['auth', 'cadastro']],
    [['usuarios', 'me', 'senha']],
    [['usuarios', 'me', 'excluir']],
    [['lancamentos', '..', 'auth', 'login']],
    [['lancamentos', '%2e%2e', 'usuarios', 'me', 'senha']],
    [['lancamentos', '']],
  ])('responde 404 sem chamar a API: %j', async (caminho) => {
    const resposta = await chamar(POST, caminho, 'POST')
    expect(resposta.status).toBe(404)
    expect(fetchFalso).not.toHaveBeenCalled()
  })
})
