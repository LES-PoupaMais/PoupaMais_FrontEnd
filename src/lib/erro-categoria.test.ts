import { describe, expect, it } from 'vitest'
import { categoriaEmUso, erroDoNomeDaCategoria, MENSAGEM_CATEGORIA_DUPLICADA } from './erro-categoria'
import { ErroApi } from './http'

describe('erros de categoria', () => {
  it('409 vira a mensagem de duplicada; 400 usa o primeiro erros[]; o resto vai para o toast', () => {
    expect(erroDoNomeDaCategoria(new ErroApi(409, 'x'))).toBe(MENSAGEM_CATEGORIA_DUPLICADA)
    expect(erroDoNomeDaCategoria(new ErroApi(400, 'x', [{ campo: 'descricao', mensagem: 'Muito longo.' }]))).toBe(
      'Muito longo.',
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
