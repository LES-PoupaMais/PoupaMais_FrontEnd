import { describe, expect, it } from 'vitest'
import { destinoSeguro } from './destino'

describe('destinoSeguro', () => {
  it('aceita caminho interno, com query', () => {
    expect(destinoSeguro('/lancamentos/novo')).toBe('/lancamentos/novo')
    expect(destinoSeguro(['/dashboard?mes=11&ano=2026', '/x'])).toBe('/dashboard?mes=11&ano=2026')
  })

  it.each([undefined, null, '', 'https://site.com', '//site.com', '/\\site.com', 'dashboard'])(
    'troca %s pelo padrão',
    (valor) => {
      expect(destinoSeguro(valor)).toBe('/dashboard')
      expect(destinoSeguro(valor, '/perfil')).toBe('/perfil')
    },
  )
})
