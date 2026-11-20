import { describe, expect, it } from 'vitest'
import { CABECALHO_MODELO_CSV, montarCsvLinhasIgnoradas, nomeArquivoLinhasIgnoradas } from './linhas-ignoradas'

describe('montarCsvLinhasIgnoradas', () => {
  it('começa com o BOM UTF-8 e o cabeçalho do modelo, sem coluna de motivo, com \\r\\n', () => {
    const csv = montarCsvLinhasIgnoradas([{ conteudo: 'Padaria;DESPESA;31/02/2026;32,50;Mercado' }])

    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toBe('﻿descricao;tipo;data;valor;categorias\r\nPadaria;DESPESA;31/02/2026;32,50;Mercado\r\n')
    expect(csv).not.toMatch(/motivo/i)
    expect(CABECALHO_MODELO_CSV).toBe('descricao;tipo;data;valor;categorias')
  })

  it('preserva aspas, ";" dentro de aspas e acentos exatamente como vieram, na ordem das falhas', () => {
    const linhas = [
      '"Farmácia; remédios";DESPESA;12/11/2026;;Saúde',
      '"Show ""ao vivo""";DESPESA;31/02/2026;80,00;Lazer',
      'Ração;DESPESA;10/11/2026;89,90;"Pet;Casa"',
    ]

    const csv = montarCsvLinhasIgnoradas(linhas.map((conteudo) => ({ conteudo })))

    expect(csv.slice(1).split('\r\n')).toEqual([CABECALHO_MODELO_CSV, ...linhas, ''])
  })

  it('sem falhas: só o cabeçalho', () => {
    expect(montarCsvLinhasIgnoradas([])).toBe(`﻿${CABECALHO_MODELO_CSV}\r\n`)
  })
})

describe('nomeArquivoLinhasIgnoradas', () => {
  it('usa a data local de hoje em AAAA-MM-DD', () => {
    expect(nomeArquivoLinhasIgnoradas(new Date(2026, 0, 5, 23, 59))).toBe('linhas-ignoradas-2026-01-05.csv')
    expect(nomeArquivoLinhasIgnoradas()).toMatch(/^linhas-ignoradas-\d{4}-\d{2}-\d{2}\.csv$/)
  })
})
