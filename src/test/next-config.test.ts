import { describe, expect, it } from 'vitest'
import nextConfig, { CABECALHOS_DE_SEGURANCA } from '../../next.config'

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

  it('manda os cabeçalhos de segurança em todas as rotas', async () => {
    const regras = await nextConfig.headers!()
    const todas = regras.find((regra) => regra.source === '/:path*')
    expect(todas?.headers).toEqual(CABECALHOS_DE_SEGURANCA)
    expect(Object.fromEntries(CABECALHOS_DE_SEGURANCA.map((c) => [c.key, c.value]))).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
  })

  it('o service worker continua sem cache, para o navegador achar a versão nova', async () => {
    const regras = await nextConfig.headers!()
    const sw = regras.find((regra) => regra.source === '/sw.js')
    expect(sw?.headers).toContainEqual({ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' })
  })
})
