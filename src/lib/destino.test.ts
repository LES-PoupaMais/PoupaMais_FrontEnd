import { describe, expect, it } from 'vitest'
import { destinoSeguro } from './destino'

describe('destinoSeguro', () => {
  it('aceita caminho interno, com query e hash', () => {
    expect(destinoSeguro('/lancamentos/novo')).toBe('/lancamentos/novo')
    expect(destinoSeguro(['/dashboard?mes=11&ano=2026', '/x'])).toBe('/dashboard?mes=11&ano=2026')
    expect(destinoSeguro('/perfil#tema')).toBe('/perfil#tema')
  })

  it('caractere codificado continua sendo um caminho deste site', () => {
    // "%09" não é decodificado pelo URL: o caminho fica /%09/x, na mesma origem
    expect(destinoSeguro('/%09/x')).toBe('/%09/x')
    expect(destinoSeguro('/%2F%2Fsite.com')).toBe('/%2F%2Fsite.com')
  })

  it.each([
    undefined,
    null,
    '',
    'dashboard',
    'https://x',
    'https://site.com',
    '//x',
    '//site.com',
    '/\\x',
    '/\\site.com',
    '/\t/evil.com',
    '/\n/x',
    '/\r/x',
    '/x\u0000',
    '/x\u007f',
  ])('troca %j pelo padrão', (valor) => {
    expect(destinoSeguro(valor)).toBe('/dashboard')
    expect(destinoSeguro(valor, '/perfil')).toBe('/perfil')
  })
})
