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
    expect(opcoes).toMatchObject({ method: 'PUT', headers: { Authorization: 'Bearer jwt-antigo' } })
    expect(JSON.parse(opcoes.body)).toEqual(senhas)
    expect(loja.set).toHaveBeenCalledWith('pm_token', 'jwt-novo', expect.objectContaining({ httpOnly: true }))
  })

  it('trocar a senha: 422 vira senha incorreta ou senha igual, sem mexer no cookie', async () => {
    fetchFalso.mockResolvedValueOnce(resposta(422, { status: 422, mensagem: 'A senha atual está incorreta' }))
    await expect(trocarSenhaAction(senhas)).resolves.toEqual({ ok: false, motivo: 'senha-incorreta' })

    fetchFalso.mockResolvedValueOnce(
      resposta(422, { status: 422, mensagem: 'A nova senha deve ser diferente da atual' }),
    )
    await expect(trocarSenhaAction(senhas)).resolves.toEqual({ ok: false, motivo: 'senha-igual' })

    fetchFalso.mockResolvedValueOnce(new Response('x', { status: 422 }))
    await expect(trocarSenhaAction(senhas)).resolves.toEqual({ ok: false, motivo: 'senha-incorreta' })
    expect(loja.set).not.toHaveBeenCalled()
  })

  it('trocar a senha: dados inválidos nem chegam à API', async () => {
    await expect(trocarSenhaAction({ senhaAtual: 'a', novaSenha: '1' })).resolves.toEqual({
      ok: false,
      motivo: 'invalido',
    })
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('falhas comuns: sem conexão, sessão vencida (apaga o cookie) e erro do servidor', async () => {
    loja.get.mockReturnValue(undefined)
    fetchFalso.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(trocarSenhaAction(senhas)).resolves.toEqual({ ok: false, motivo: 'conexao' })
    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBeUndefined()

    fetchFalso.mockResolvedValueOnce(resposta(401, { status: 401, mensagem: 'x' }))
    await expect(excluirContaAction({ senha: 'poupa2026' })).resolves.toEqual({ ok: false, motivo: 'sessao' })
    expect(loja.delete).toHaveBeenCalledWith('pm_token')

    fetchFalso.mockResolvedValueOnce(resposta(500, { status: 500, mensagem: 'x' }))
    await expect(excluirContaAction({ senha: 'poupa2026' })).resolves.toEqual({ ok: false, motivo: 'erro' })
  })

  it('excluir a conta: 204 apaga o cookie; 422 é senha incorreta; senha vazia não chama a API', async () => {
    fetchFalso.mockResolvedValueOnce(resposta(204))
    await expect(excluirContaAction({ senha: 'poupa2026' })).resolves.toEqual({ ok: true })
    const [url, opcoes] = fetchFalso.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/usuarios\/me\/excluir$/)
    expect(opcoes.method).toBe('POST')
    expect(loja.delete).toHaveBeenCalledWith('pm_token')

    loja.delete.mockClear()
    fetchFalso.mockResolvedValueOnce(resposta(422, { status: 422, mensagem: 'Senha incorreta' }))
    await expect(excluirContaAction({ senha: 'errada' })).resolves.toEqual({ ok: false, motivo: 'senha-incorreta' })
    expect(loja.delete).not.toHaveBeenCalled()

    await expect(excluirContaAction({ senha: '' })).resolves.toEqual({ ok: false, motivo: 'invalido' })
    expect(fetchFalso).toHaveBeenCalledTimes(2)
  })
})
