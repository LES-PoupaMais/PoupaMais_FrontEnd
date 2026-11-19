// @vitest-environment node
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from './proxy'

const pedir = (url: string, logado = false) => {
  const pedido = new NextRequest(`http://localhost:3000${url}`)
  if (logado) pedido.cookies.set('pm_token', 'x')
  return proxy(pedido)
}

describe('proxy', () => {
  it('sem sessão, guarda caminho + query no voltar', () => {
    const resposta = pedir('/lancamentos?mes=11&ano=2026&categoria=2')
    const destino = new URL(resposta.headers.get('location')!)
    expect(destino.pathname).toBe('/login')
    expect(destino.searchParams.get('voltar')).toBe('/lancamentos?mes=11&ano=2026&categoria=2')
  })

  it('sem query, só o caminho', () => {
    const destino = new URL(pedir('/perfil').headers.get('location')!)
    expect(destino.searchParams.get('voltar')).toBe('/perfil')
  })

  it('logado: /login leva ao dashboard; rota privada segue', () => {
    expect(new URL(pedir('/login', true).headers.get('location')!).pathname).toBe('/dashboard')
    expect(pedir('/dashboard', true).headers.get('location')).toBeNull()
  })
})
