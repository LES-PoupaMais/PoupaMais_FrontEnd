import { describe, expect, it } from 'vitest'
import {
  lerDataDigitada,
  dataBrParaIso,
  ehDataIsoValida,
  formatarData,
  formatarDataCurta,
  formatarDataExtenso,
  formatarInstante,
  hojeIso,
  mensagemDataForaDaFaixa,
  paraDataIso,
  partesDaData,
} from './data'

describe('data do lançamento', () => {
  it.each(['2026-11-18', '2024-02-29', '2000-01-01', '2100-12-31'])('aceita a data que existe %s', (iso) => {
    expect(ehDataIsoValida(iso)).toBe(true)
  })

  it.each(['2026-02-31', '2025-02-29', '2026-13-01', '2026-00-10', '18/11/2026', '2026-1-5', ''])(
    'recusa %s',
    (iso) => {
      expect(ehDataIsoValida(iso)).toBe(false)
    },
  )

  it('separa as partes e recusa a data que não existe', () => {
    expect(partesDaData('2026-11-05')).toEqual({ dia: 5, mes: 11, ano: 2026 })
    expect(() => partesDaData('2026-02-31')).toThrow(RangeError)
  })

  it('formata nos três formatos do Design System', () => {
    expect(formatarData('2026-11-05')).toBe('05/11/2026')
    expect(formatarDataCurta('2026-11-18')).toBe('18 nov')
    expect(formatarDataCurta('2026-03-05')).toBe('5 mar')
    expect(formatarDataExtenso('2026-11-18')).toBe('18 de novembro de 2026')
  })

  it('converte o texto dd/mm/aaaa para ISO', () => {
    expect(dataBrParaIso('18/11/2026')).toBe('2026-11-18')
    expect(dataBrParaIso(' 05/01/2027 ')).toBe('2027-01-05')
    expect(dataBrParaIso('31/02/2026')).toBeNull()
    expect(dataBrParaIso('2026-11-18')).toBeNull()
  })

  it('usa o dia do calendário local', () => {
    expect(paraDataIso(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05')
    expect(hojeIso(new Date(2026, 0, 2))).toBe('2026-01-02')
    expect(hojeIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('mostra o instante da auditoria no fuso de quem vê', () => {
    const instante = '2026-11-05T22:42:00Z'
    const local = new Date(instante)
    const esperado = `${paraDataIso(local).split('-').reverse().join('/')} às ${String(local.getHours()).padStart(2, '0')}:42`

    expect(formatarInstante(instante)).toBe(esperado)
    expect(() => formatarInstante('ontem')).toThrow(RangeError)
  })
})

describe('lerDataDigitada', () => {
  it.each([
    ['18/11/2026', '2026-11-18'],
    ['18112026', '2026-11-18'],
    ['18-11-2026', '2026-11-18'],
    ['5/1/2026', '2026-01-05'],
    [' 29/02/2028 ', '2028-02-29'],
  ])('"%s" vira %s', (texto, iso) => {
    expect(lerDataDigitada(texto)).toBe(iso)
  })

  it.each(['31/02/2026', '29/02/2026', '2026-11-18', '1811202', 'amanhã', ''])('recusa "%s"', (texto) => {
    expect(lerDataDigitada(texto)).toBeNull()
  })
})

describe('mensagemDataForaDaFaixa', () => {
  it('usa a faixa padrão 01/01/2000 a 31/12/2100', () => {
    expect(mensagemDataForaDaFaixa()).toBe('Informe uma data entre 01/01/2000 e 31/12/2100.')
  })

  it('usa os limites recebidos', () => {
    expect(mensagemDataForaDaFaixa('2026-01-01', '2026-12-31')).toBe('Informe uma data entre 01/01/2026 e 31/12/2026.')
  })
})
