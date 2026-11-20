import { describe, expect, it } from 'vitest'
import { lancamentoSchema, MENSAGENS_LANCAMENTO as M } from './lancamento.schema'

const valido = {
  descricao: 'Mercado do mês',
  tipo: 'DESPESA' as const,
  data: '2026-11-05',
  valor: 1120.35,
  categoriaIds: [2],
}

const erros = (dados: unknown) => {
  const resultado = lancamentoSchema.safeParse(dados)
  return resultado.success ? {} : Object.fromEntries(resultado.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('lancamentoSchema (RN001)', () => {
  it('aceita o lançamento completo e tira os espaços da descrição', () => {
    expect(lancamentoSchema.parse({ ...valido, descricao: '  Mercado do mês  ' }).descricao).toBe('Mercado do mês')
  })

  it('exige descrição, até 100 caracteres', () => {
    expect(erros({ ...valido, descricao: '   ' }).descricao).toBe(M.descricaoObrigatoria)
    expect(erros({ ...valido, descricao: 'a'.repeat(101) }).descricao).toBe(M.descricaoLonga)
    expect(erros({ ...valido, descricao: 'a'.repeat(100) })).toEqual({})
  })

  it('exige o tipo', () => {
    expect(erros({ ...valido, tipo: 'OUTRO' }).tipo).toBe(M.tipo)
  })

  it.each([
    ['', M.dataObrigatoria],
    [undefined, M.dataObrigatoria],
    ['2026-02-31', M.dataInvalida],
    ['05/11/2026', M.dataInvalida],
    ['1999-12-31', M.dataFaixa],
    ['2101-01-01', M.dataFaixa],
  ])('recusa a data %s', (data, mensagem) => {
    expect(erros({ ...valido, data }).data).toBe(mensagem)
  })

  it.each(['2000-01-01', '2100-12-31', '2024-02-29'])('aceita a data %s', (data) => {
    expect(erros({ ...valido, data })).toEqual({})
  })

  it('exige valor maior que zero, com centavos, até R$ 999.999.999,99', () => {
    expect(erros({ ...valido, valor: 0 }).valor).toBe(M.valorPositivo)
    expect(erros({ ...valido, valor: -5 }).valor).toBe(M.valorPositivo)
    expect(erros({ ...valido, valor: 1_000_000_000 }).valor).toBe(M.valorMaximo)
    expect(erros({ ...valido, valor: undefined }).valor).toBe(M.valorObrigatorio)
    expect(erros({ ...valido, valor: 999_999_999.99 })).toEqual({})
  })

  it('usa as mensagens do Design System e da prancheta novo-erros-celular', () => {
    expect(erros({ descricao: '', tipo: 'X', data: '2026-02-31', valor: 0, categoriaIds: [] })).toEqual({
      descricao: 'A descrição é obrigatória.',
      tipo: 'Escolha Receita ou Despesa.',
      data: 'Informe uma data válida, no formato dd/mm/aaaa.',
      valor: 'Informe um valor maior que zero.',
      categoriaIds: 'Informe pelo menos uma categoria.',
    })
    expect(erros({ ...valido, descricao: 'a'.repeat(101) }).descricao).toBe(
      'A descrição deve ter no máximo 100 caracteres.',
    )
    expect(erros({ ...valido, valor: undefined }).valor).toBe('Informe um valor maior que zero.')
    expect(erros({ ...valido, valor: 1_000_000_000 }).valor).toBe('O valor máximo é R$ 999.999.999,99.')
  })

  it('exige pelo menos uma categoria', () => {
    expect(erros({ ...valido, categoriaIds: [] }).categoriaIds).toBe(M.categorias)
    expect(erros({ ...valido, categoriaIds: [1, 2] })).toEqual({})
  })
})
