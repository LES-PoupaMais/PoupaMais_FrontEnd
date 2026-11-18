import { describe, expect, it } from 'vitest'
import { comPeriodo, deslocarMes, lerPeriodo, mesAtual } from './periodo'

const agora = new Date(2026, 10, 18)

describe('período do filtro', () => {
  it('lê mês e ano da URL', () => {
    expect(lerPeriodo(new URLSearchParams('mes=9&ano=2026'), agora)).toEqual({ mes: 9, ano: 2026 })
  })

  it.each(['', 'mes=13&ano=2026', 'mes=0&ano=2026', 'mes=5', 'mes=5&ano=1999', 'mes=abc&ano=2026'])(
    'sem parâmetro válido (%s) usa o mês atual',
    (busca) => {
      expect(lerPeriodo(new URLSearchParams(busca), agora)).toEqual({ mes: 11, ano: 2026 })
    },
  )

  it('mês atual e deslocamento atravessando o ano', () => {
    expect(mesAtual(agora)).toEqual({ mes: 11, ano: 2026 })
    expect(mesAtual().ano).toBeGreaterThanOrEqual(2026)
    expect(deslocarMes({ mes: 1, ano: 2026 }, -1)).toEqual({ mes: 12, ano: 2025 })
    expect(deslocarMes({ mes: 12, ano: 2026 }, 1)).toEqual({ mes: 1, ano: 2027 })
    expect(deslocarMes({ mes: 11, ano: 2026 }, -3)).toEqual({ mes: 8, ano: 2026 })
  })

  it('monta a query preservando os outros filtros', () => {
    expect(comPeriodo('tipo=DESPESA&mes=1', { mes: 11, ano: 2026 })).toBe('tipo=DESPESA&mes=11&ano=2026')
  })
})
