import { describe, expect, it } from 'vitest'
import { FOTO_MAXIMO_BYTES, excluirContaSchema, nomeSchema, trocarSenhaSchema, validarFoto } from './perfil.schema'

const mensagens = (resultado: { success: boolean; error?: { issues: { message: string }[] } }) =>
  resultado.error?.issues.map((i) => i.message) ?? []

describe('perfil.schema', () => {
  it('nome: obrigatório, com trim, até 150', () => {
    expect(mensagens(nomeSchema.safeParse({ nome: '   ' }))).toEqual(['Informe seu nome.'])
    expect(mensagens(nomeSchema.safeParse({ nome: 'a'.repeat(151) }))).toEqual(['O nome pode ter até 150 caracteres.'])
    expect(nomeSchema.parse({ nome: '  Leonardo ' })).toEqual({ nome: 'Leonardo' })
  })

  it('troca de senha: atual, mínimo de 6, diferente da atual e confirmação igual', () => {
    expect(mensagens(trocarSenhaSchema.safeParse({ senhaAtual: '', novaSenha: '123', confirmarSenha: '' }))).toEqual([
      'Informe a senha atual.',
      'A senha precisa ter pelo menos 6 caracteres.',
      'Confirme a nova senha.',
    ])
    expect(
      mensagens(
        trocarSenhaSchema.safeParse({ senhaAtual: 'poupa2025', novaSenha: 'poupa2025', confirmarSenha: 'poupa2025' }),
      ),
    ).toEqual(['A nova senha deve ser diferente da atual.'])
    expect(
      mensagens(
        trocarSenhaSchema.safeParse({ senhaAtual: 'poupa2025', novaSenha: 'poupa2026', confirmarSenha: 'poupa2062' }),
      ),
    ).toEqual(['As senhas não são iguais.'])
    expect(
      trocarSenhaSchema.safeParse({ senhaAtual: 'poupa2025', novaSenha: 'poupa2026', confirmarSenha: 'poupa2026' })
        .success,
    ).toBe(true)
  })

  it('excluir conta exige a senha', () => {
    expect(mensagens(excluirContaSchema.safeParse({ senha: '' }))).toEqual(['Informe sua senha.'])
  })

  it('foto: JPG, PNG ou WEBP até 2 MB (RN015)', () => {
    expect(validarFoto({ type: 'image/png', size: 1000 })).toBeNull()
    expect(validarFoto({ type: 'image/webp', size: FOTO_MAXIMO_BYTES })).toBeNull()
    expect(validarFoto({ type: 'image/gif', size: 10 })).toBe('A foto deve ser uma imagem JPG, PNG ou WEBP.')
    expect(validarFoto({ type: 'image/jpeg', size: FOTO_MAXIMO_BYTES + 1 })).toBe(
      'A foto deve ter no máximo 2 MB. Escolha uma imagem menor.',
    )
  })
})
