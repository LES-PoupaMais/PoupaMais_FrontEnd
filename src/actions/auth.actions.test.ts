import { beforeEach, describe, expect, it, vi } from 'vitest'

const loja = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }
const redirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT')
})

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => loja }))
vi.mock('next/navigation', () => ({ redirect }))

const { logoutAction } = await import('./auth.actions')

describe('auth.actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('logoutAction apaga o cookie da sessão e redireciona para o login', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(loja.delete).toHaveBeenCalledWith('pm_token')
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(loja.delete.mock.invocationCallOrder[0]).toBeLessThan(redirect.mock.invocationCallOrder[0])
  })
})
