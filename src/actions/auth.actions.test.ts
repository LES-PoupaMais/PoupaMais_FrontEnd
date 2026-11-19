import { http as msw, HttpResponse } from 'msw/http'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'

const loja = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }
const redirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT')
})

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => loja }))
vi.mock('next/navigation', () => ({ redirect }))

const { cadastroAction, loginAction, logoutAction } = await import('./auth.actions')

const login = {
  token: 'jwt-novo',
  expiraEm: '2026-11-19T03:00:00Z',
  usuario: { id: 1, nome: 'Ana', email: 'ana@x.com' },
}
const cadastro = { nome: 'Ana', email: 'ana@x.com', senha: '123456', confirmarSenha: '123456', aceiteTermos: true }

describe('auth.actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('logoutAction apaga o cookie da sessão e redireciona para o login', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(loja.delete).toHaveBeenCalledWith('pm_token')
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(loja.delete.mock.invocationCallOrder[0]).toBeLessThan(redirect.mock.invocationCallOrder[0])
  })

  it('loginAction grava o cookie httpOnly com o token e a validade', async () => {
    let enviado: unknown
    server.use(
      msw.post('*/api/auth/login', async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json(login)
      }),
    )

    await expect(loginAction({ email: ' ana@x.com ', senha: 'segredo' })).resolves.toEqual({ ok: true })

    expect(enviado).toEqual({ email: 'ana@x.com', senha: 'segredo' })
    expect(loja.set).toHaveBeenCalledWith(
      'pm_token',
      'jwt-novo',
      expect.objectContaining({ httpOnly: true, expires: new Date(login.expiraEm) }),
    )
  })

  it('loginAction com credenciais inválidas devolve 401 e não grava nada', async () => {
    server.use(msw.post('*/api/auth/login', () => HttpResponse.json({ status: 401, mensagem: 'x' }, { status: 401 })))

    await expect(loginAction({ email: 'ana@x.com', senha: 'errada' })).resolves.toEqual({
      ok: false,
      status: 401,
      erros: [],
    })
    expect(loja.set).not.toHaveBeenCalled()
  })

  it('loginAction valida no servidor antes de chamar a API', async () => {
    const resultado = await loginAction({ email: 'invalido', senha: '' })

    expect(resultado).toEqual({
      ok: false,
      status: 400,
      erros: [
        { campo: 'email', mensagem: '' },
        { campo: 'senha', mensagem: '' },
      ],
    })
  })

  it('cadastroAction cria a conta com o aceite e já entra', async () => {
    let criado: unknown
    server.use(
      msw.post('*/api/auth/cadastro', async ({ request }) => {
        criado = await request.json()
        return HttpResponse.json({ id: 1, nome: 'Ana', email: 'ana@x.com' }, { status: 201 })
      }),
      msw.post('*/api/auth/login', () => HttpResponse.json(login)),
    )

    await expect(cadastroAction(cadastro)).resolves.toEqual({ ok: true })

    expect(criado).toEqual({ nome: 'Ana', email: 'ana@x.com', senha: '123456', aceiteTermos: true })
    expect(loja.set).toHaveBeenCalledWith('pm_token', 'jwt-novo', expect.anything())
  })

  it('cadastroAction com e-mail já usado devolve 409 sem entrar', async () => {
    server.use(
      msw.post('*/api/auth/cadastro', () => HttpResponse.json({ status: 409, mensagem: 'x' }, { status: 409 })),
    )

    await expect(cadastroAction(cadastro)).resolves.toMatchObject({ ok: false, status: 409 })
    expect(loja.set).not.toHaveBeenCalled()
  })

  it('cadastroAction recusa sem o aceite da Política', async () => {
    await expect(cadastroAction({ ...cadastro, aceiteTermos: false })).resolves.toEqual({
      ok: false,
      status: 400,
      erros: [{ campo: 'aceiteTermos', mensagem: '' }],
    })
  })
})
