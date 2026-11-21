import { describe, expect, it } from 'vitest'
import { categoriaSchema } from './categoria.schema'

describe('categoriaSchema (RN002)', () => {
  it('tira os espaços e exige o nome, até 255 caracteres', () => {
    expect(categoriaSchema.parse({ descricao: '  Mercado ' }).descricao).toBe('Mercado')
    expect(categoriaSchema.safeParse({ descricao: '  ' }).success).toBe(false)
    expect(categoriaSchema.safeParse({ descricao: 'a'.repeat(256) }).success).toBe(false)
  })
})
