import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loja = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => loja }))

const { excluirContaAction, trocarSenhaAction } = await import('./perfil.actions')

const fetchFalso = vi.fn()
const resposta = (status: number, corpo?: unknown) =>
  new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const senhas = { senhaAtual: 'poupa2025', novaSenha: 'poupa2026' }

describe('perfil.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loja.get.mockReturnValue({ value: 'jwt-antigo' })
    vi.stubGlobal('fetch', fetchFalso)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('trocar a senha manda o token atual e grava o token novo no cookie', async () => {
    fetchFalso.mockResolvedValue(resposta(200, { token: 'jwt-novo', expiraEm: '2026-11-19T10:00:00Z' }))

    await expect(trocarSenhaAction(senhas)).resolves.toEqual({ ok: true })

    const [url, opcoes] = fetchFalso.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/usuarios\/me\/senha$/)
    expect(opcoes.method).toBe('PUT')
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-antigo')
    expect(JSON.parse(opcoes.body)).toEqual(senhas)
    expect(loja.set).toHaveBeenCalledWith('pm_token', 'jwt-novo', expect.objectContaining({ httpOnly: true }))
  })

  it('trocar a senha: 422 devolve a mensagem da API como veio, sem deduzir a causa e sem mexer no cookie', async () => {
    fetchFalso.mockResolvedValueOnce(resposta(422, { status: 422, mensagem: 'A senha atual está incorreta' }))
    await expect(trocarSenhaAction(senhas)).resolves.toEqual({
      ok: false,
      status: 422,
      mensagem: 'A senha atual está incorreta',
      erros: [],
    })

    fetchFalso.mockResolvedValueOnce(new Response('x', { status: 422 }))
    await expect(trocarSenhaAction(senhas)).resolves.toEqual({ ok: false, status: 422, mensagem: null, erros: [] })
    expect(loja.set).not.toHaveBeenCalled()
  })

  it('trocar a senha: dados inválidos nem chegam à API', async () => {
    await expect(trocarSenhaAction({ senhaAtual: 'a', novaSenha: '1' })).resolves.toEqual({
      ok: false,
      status: 400,
      mensagem: null,
      erros: [],
    })
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('falhas comuns: sem conexão, sessão vencida (apaga o cookie) e erro do servidor', async () => {
    loja.get.mockReturnValue(undefined)
    fetchFalso.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(trocarSenhaAction(senhas)).resolves.toMatchObject({ ok: false, status: 0 })
    expect(new Headers(fetchFalso.mock.calls[0][1].headers).get('Authorization')).toBeNull()

    fetchFalso.mockResolvedValueOnce(resposta(401, { status: 401, mensagem: 'x' }))
    await expect(excluirContaAction({ senha: 'poupa2026' })).resolves.toMatchObject({ ok: false, status: 401 })
    expect(loja.delete).toHaveBeenCalledWith('pm_token')

    fetchFalso.mockResolvedValueOnce(resposta(500, { status: 500, mensagem: 'x' }))
    await expect(excluirContaAction({ senha: 'poupa2026' })).resolves.toMatchObject({ ok: false, status: 500 })
  })

  it('excluir a conta: 204 apaga o cookie; 422 devolve a mensagem da API; senha vazia não chama a API', async () => {
    fetchFalso.mockResolvedValueOnce(resposta(204))
    await expect(excluirContaAction({ senha: 'poupa2026' })).resolves.toEqual({ ok: true })
    const [url, opcoes] = fetchFalso.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/usuarios\/me\/excluir$/)
    expect(opcoes.method).toBe('POST')
    expect(loja.delete).toHaveBeenCalledWith('pm_token')

    loja.delete.mockClear()
    fetchFalso.mockResolvedValueOnce(resposta(422, { status: 422, mensagem: 'Senha incorreta' }))
    await expect(excluirContaAction({ senha: 'errada' })).resolves.toEqual({
      ok: false,
      status: 422,
      mensagem: 'Senha incorreta',
      erros: [],
    })
    expect(loja.delete).not.toHaveBeenCalled()

    await expect(excluirContaAction({ senha: '' })).resolves.toMatchObject({ ok: false, status: 400 })
    expect(fetchFalso).toHaveBeenCalledTimes(2)
  })
})
