import { describe, expect, it } from 'vitest'
import {
  formatarIntervaloMeses,
  formatarMarca,
  formatarSaldoCurto,
  intervaloPorExtenso,
  marcasDoEixo,
  mesPorExtenso,
} from './escala-grafico'

describe('escala dos gráficos', () => {
  it('zero + 3 marcas redondas que cobrem os dados', () => {
    expect(marcasDoEixo([11900, 12480.5, 7560.5])).toEqual([0, 5000, 10000, 15000])
    expect(marcasDoEixo([3579.6, 2179.85, 4359.2, 4920])).toEqual([0, 2000, 4000, 6000])
    expect(marcasDoEixo([300, 700])).toEqual([0, 250, 500, 750])
  })

  it('com saldo negativo, as marcas descem abaixo do zero', () => {
    expect(marcasDoEixo([3359.85, 3859.4, 3694.7, -750.4])).toEqual([-2000, 0, 2000, 4000])
    expect(marcasDoEixo([-100, -900])).toEqual([-1500, -1000, -500, 0])
  })

  it('sem valores, usa um passo mínimo', () => {
    expect(marcasDoEixo([0, 0])).toEqual([0, 1000, 2000, 3000])
  })

  it('rótulos das marcas', () => {
    expect(formatarMarca(0)).toBe('R$ 0')
    expect(formatarMarca(500)).toBe('R$ 500')
    expect(formatarMarca(5000)).toBe('R$ 5 mil')
    expect(formatarMarca(2500)).toBe('R$ 2,5 mil')
    expect(formatarMarca(-2000)).toBe('R$ −2 mil')
    expect(formatarMarca(1_500_000)).toBe('R$ 1,5 mi')
  })

  it('períodos e saldos', () => {
    const meses = [
      { mes: 8, ano: 2026 },
      { mes: 11, ano: 2026 },
    ]
    expect(formatarIntervaloMeses(meses)).toBe('Ago a Nov/2026')
    expect(
      formatarIntervaloMeses([
        { mes: 11, ano: 2025 },
        { mes: 2, ano: 2026 },
      ]),
    ).toBe('Nov/2025 a Fev/2026')
    expect(formatarIntervaloMeses([{ mes: 2, ano: 2026 }])).toBe('Fev/2026')
    expect(formatarIntervaloMeses([])).toBe('')
    expect(intervaloPorExtenso(meses)).toBe('de agosto a novembro de 2026')
    expect(
      intervaloPorExtenso([
        { mes: 12, ano: 2025 },
        { mes: 1, ano: 2026 },
      ]),
    ).toBe('de dezembro de 2025 a janeiro de 2026')
    expect(intervaloPorExtenso([])).toBe('')
    expect(mesPorExtenso(8, 2026)).toBe('Agosto de 2026')
    expect(formatarSaldoCurto(4920)).toBe('+4.920,00')
    expect(formatarSaldoCurto(-750.4)).toBe('−750,40')
    expect(formatarSaldoCurto(0)).toBe('0,00')
  })
})
