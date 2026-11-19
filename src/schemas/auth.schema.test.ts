import { describe, expect, it } from 'vitest'
import { cadastroSchema, loginSchema, recuperarSenhaSchema, redefinirSenhaSchema } from './auth.schema'

const cadastro = {
  nome: 'Usuário Demo',
  email: 'demo@poupamais.com.br',
  senha: '123456',
  confirmarSenha: '123456',
  aceiteTermos: true,
}

const mensagem = (
  resultado: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  campo: string,
) => resultado.error?.issues.find((i) => i.path.join('.') === campo)?.message

describe('auth.schema (RN011)', () => {
  it('login exige e-mail válido e senha', () => {
    expect(loginSchema.safeParse({ email: ' demo@poupamais.com.br ', senha: 'x' }).success).toBe(true)
    expect(mensagem(loginSchema.safeParse({ email: '', senha: '' }), 'email')).toBe('Informe o e-mail.')
    expect(mensagem(loginSchema.safeParse({ email: 'demo', senha: 'x' }), 'email')).toBe(
      'Informe um e-mail válido, como voce@email.com.',
    )
    expect(mensagem(loginSchema.safeParse({ email: 'demo@poupamais.com.br', senha: '' }), 'senha')).toBe(
      'Informe a senha.',
    )
  })

  it('cadastro aceita os dados completos', () => {
    expect(cadastroSchema.safeParse(cadastro).success).toBe(true)
  })

  it('cadastro exige senha de 6 a 72, confirmação igual e aceite da Política', () => {
    expect(mensagem(cadastroSchema.safeParse({ ...cadastro, senha: '123', confirmarSenha: '123' }), 'senha')).toMatch(
      /pelo menos 6/,
    )
    expect(
      mensagem(
        cadastroSchema.safeParse({ ...cadastro, senha: 'a'.repeat(73), confirmarSenha: 'a'.repeat(73) }),
        'senha',
      ),
    ).toMatch(/até 72/)
    expect(mensagem(cadastroSchema.safeParse({ ...cadastro, confirmarSenha: '654321' }), 'confirmarSenha')).toBe(
      'As senhas não são iguais.',
    )
    expect(mensagem(cadastroSchema.safeParse({ ...cadastro, aceiteTermos: false }), 'aceiteTermos')).toMatch(
      /Política de Privacidade/,
    )
    expect(mensagem(cadastroSchema.safeParse({ ...cadastro, nome: ' ' }), 'nome')).toBe('Informe seu nome.')
  })

  it('esqueci a senha exige só um e-mail válido (RN014)', () => {
    expect(recuperarSenhaSchema.safeParse({ email: 'demo@poupamais.com.br' }).success).toBe(true)
    expect(mensagem(recuperarSenhaSchema.safeParse({ email: '' }), 'email')).toBe('Informe o e-mail.')
  })

  it('redefinir exige a nova senha de 6 a 72 e a confirmação igual', () => {
    expect(redefinirSenhaSchema.safeParse({ novaSenha: '123456', confirmarSenha: '123456' }).success).toBe(true)
    expect(mensagem(redefinirSenhaSchema.safeParse({ novaSenha: '123', confirmarSenha: '123' }), 'novaSenha')).toBe(
      'A senha deve ter pelo menos 6 caracteres.',
    )
    expect(
      mensagem(redefinirSenhaSchema.safeParse({ novaSenha: '123456', confirmarSenha: '1234567' }), 'confirmarSenha'),
    ).toBe('As senhas não são iguais.')
    expect(
      mensagem(redefinirSenhaSchema.safeParse({ novaSenha: '123456', confirmarSenha: '' }), 'confirmarSenha'),
    ).toBe('Confirme a senha.')
  })
})
