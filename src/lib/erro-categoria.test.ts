import { describe, expect, it } from 'vitest'
import { categoriaEmUso, erroDoNomeDaCategoria, MENSAGEM_CATEGORIA_DUPLICADA } from './erro-categoria'
import { ErroApi, MENSAGEM_CAMPO_PADRAO } from './http'

describe('erros de categoria', () => {
  it('409 vai para o campo Nome: a mensagem da API como veio (ou a do DS, se não veio)', () => {
    expect(erroDoNomeDaCategoria(new ErroApi(409, 'Já existe uma categoria com essa descrição', [], true))).toBe(
      'Já existe uma categoria com essa descrição',
    )
    expect(erroDoNomeDaCategoria(new ErroApi(409, 'x'))).toBe(MENSAGEM_CATEGORIA_DUPLICADA)
    expect(MENSAGEM_CATEGORIA_DUPLICADA).toBe('Já existe uma categoria com essa descrição.')
  })

  it('400 usa o primeiro erros[] como veio; o resto vai para o toast', () => {
    expect(erroDoNomeDaCategoria(new ErroApi(400, 'x', [{ campo: 'descricao', mensagem: 'Muito longo.' }], true))).toBe(
      'Muito longo.',
    )
    expect(erroDoNomeDaCategoria(new ErroApi(400, 'x', [{ campo: 'descricao', mensagem: '' }]))).toBe(
      MENSAGEM_CAMPO_PADRAO,
    )
    expect(erroDoNomeDaCategoria(new ErroApi(400, 'x'))).toBeNull()
    expect(erroDoNomeDaCategoria(new ErroApi(500, 'x'))).toBeNull()
    expect(erroDoNomeDaCategoria(new Error('x'))).toBeNull()
  })

  it('422 no DELETE = em uso', () => {
    expect(categoriaEmUso(new ErroApi(422, 'x'))).toBe(true)
    expect(categoriaEmUso(new ErroApi(404, 'x'))).toBe(false)
    expect(categoriaEmUso('x')).toBe(false)
  })
})
