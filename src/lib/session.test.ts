import { beforeEach, describe, expect, it, vi } from 'vitest'

const loja = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => loja }))

const { encerrarSessao, gravarSessao, obterToken } = await import('./session')

describe('session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lê o token do cookie pm_token', async () => {
    loja.get.mockReturnValue({ value: 'jwt-abc' })

    await expect(obterToken()).resolves.toBe('jwt-abc')
    expect(loja.get).toHaveBeenCalledWith('pm_token')
  })

  it('devolve undefined sem sessão', async () => {
    loja.get.mockReturnValue(undefined)

    await expect(obterToken()).resolves.toBeUndefined()
  })

  it('grava o token em cookie httpOnly com a expiração da API', async () => {
    await gravarSessao('jwt-abc', '2026-11-06T20:00:00Z')

    expect(loja.set).toHaveBeenCalledWith(
      'pm_token',
      'jwt-abc',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date('2026-11-06T20:00:00Z'),
      }),
    )
  })

  it('apaga o cookie ao encerrar a sessão', async () => {
    await encerrarSessao()

    expect(loja.delete).toHaveBeenCalledWith('pm_token')
  })
})
