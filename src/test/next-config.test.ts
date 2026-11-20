import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'

// O `next dev` registra os argumentos das Server Actions (inclusive senhas) se `logging.serverFunctions` não for `false`.
describe('next.config', () => {
  it('não registra os argumentos das Server Actions no terminal', () => {
    expect(nextConfig.logging).toMatchObject({ serverFunctions: false })
  })

  it('mantém o registro das requisições', () => {
    expect(nextConfig.logging).not.toBe(false)
    const logging = nextConfig.logging || {}
    expect(logging.incomingRequests).not.toBe(false)
  })
})
