import { describe, expect, it } from 'vitest'
import { formatarMoeda, formatarPeriodo, formatarValorComSinal, nomeDoMes } from './format'

// O Intl usa espaço não separável depois do "R$": por isso o \s nas expressões
describe('format', () => {
  it('formata valores em reais no padrão brasileiro', () => {
    expect(formatarMoeda(8500)).toMatch(/^R\$\s8\.500,00$/)
    expect(formatarMoeda(0.5)).toMatch(/^R\$\s0,50$/)
  })

  it('mostra o sinal conforme o tipo do lançamento', () => {
    expect(formatarValorComSinal(8500, 'RECEITA')).toMatch(/^\+R\$\s8\.500,00$/)
    expect(formatarValorComSinal(680, 'DESPESA')).toMatch(/^-R\$\s680,00$/)
  })

  it('devolve o nome do mês', () => {
    expect(nomeDoMes(1)).toBe('Janeiro')
    expect(nomeDoMes(8)).toBe('Agosto')
    expect(nomeDoMes(12)).toBe('Dezembro')
  })

  it.each([0, 13, 2.5])('recusa o mês inválido %s', (mes) => {
    expect(() => nomeDoMes(mes)).toThrow(RangeError)
  })

  it('formata o período como na listagem do protótipo', () => {
    expect(formatarPeriodo(8, 2026)).toBe('Ago/2026')
    expect(formatarPeriodo(3, 2027)).toBe('Mar/2027')
  })
})
