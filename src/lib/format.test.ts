import { describe, expect, it } from 'vitest'
import {
  formatarMesAno,
  formatarMoeda,
  formatarPeriodo,
  formatarSaldo,
  formatarValorComSinal,
  MENOS,
  nomeDoMes,
} from './format'

// O Intl usa espaço não separável depois do "R$": por isso o \s nas expressões
describe('format', () => {
  it('formata valores em reais no padrão brasileiro, sempre com centavos', () => {
    expect(formatarMoeda(8500)).toMatch(/^R\$\s8\.500,00$/)
    expect(formatarMoeda(0.5)).toMatch(/^R\$\s0,50$/)
    expect(formatarMoeda('1120.35')).toMatch(/^R\$\s1\.120,35$/)
    expect(formatarMoeda(999999999.99)).toMatch(/^R\$\s999\.999\.999,99$/)
  })

  it('recusa valor que não é número', () => {
    expect(() => formatarMoeda('abc')).toThrow(RangeError)
  })

  it('mostra o sinal do tipo, com o menos tipográfico e espaço antes do R$', () => {
    expect(formatarValorComSinal(8500, 'RECEITA')).toMatch(/^\+ R\$\s8\.500,00$/)
    expect(formatarValorComSinal(680, 'DESPESA')).toMatch(new RegExp(`^${MENOS} R\\$\\s680,00$`))
    // o sinal vem do tipo, nunca do número
    expect(formatarValorComSinal(-680, 'DESPESA')).toMatch(new RegExp(`^${MENOS} R\\$\\s680,00$`))
  })

  it('formata o saldo com "−" só quando é negativo', () => {
    expect(formatarSaldo(4920)).toMatch(/^R\$\s4\.920,00$/)
    expect(formatarSaldo(-750.4)).toMatch(new RegExp(`^${MENOS} R\\$\\s750,40$`))
  })

  it('devolve o nome do mês', () => {
    expect(nomeDoMes(1)).toBe('Janeiro')
    expect(nomeDoMes(8)).toBe('Agosto')
    expect(nomeDoMes(12)).toBe('Dezembro')
  })

  it.each([0, 13, 2.5])('recusa o mês inválido %s', (mes) => {
    expect(() => nomeDoMes(mes)).toThrow(RangeError)
  })

  it('formata o período abreviado e o mês do filtro', () => {
    expect(formatarPeriodo(8, 2026)).toBe('Ago/2026')
    expect(formatarPeriodo(3, 2027)).toBe('Mar/2027')
    expect(formatarMesAno(11, 2026)).toBe('Novembro 2026')
  })
})
