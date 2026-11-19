import { describe, expect, it } from 'vitest'
import {
  ErroApi,
  MENSAGEM_CAMPO_PADRAO,
  MENSAGEM_ERRO_PADRAO,
  MENSAGEM_SEM_CONEXAO,
  MENSAGENS_POR_STATUS,
  traduzirErro,
} from './http'

describe('traduzirErro (lib/http)', () => {
  it('nunca devolve a mensagem crua da API', () => {
    const erro = new ErroApi(409, 'DataIntegrityViolationException: uk_usuario_email')

    const traduzido = traduzirErro(erro)

    expect(traduzido).toEqual({ status: 409, mensagem: MENSAGENS_POR_STATUS[409], campos: {} })
    expect(traduzido.mensagem).not.toContain('Exception')
  })

  it('sem conexão (status 0) e sessão vencida (401) usam as frases do DS', () => {
    expect(traduzirErro(new ErroApi(0, 'x')).mensagem).toBe(MENSAGEM_SEM_CONEXAO)
    expect(traduzirErro(new ErroApi(401, 'x')).mensagem).toBe('Sua sessão venceu. Entre de novo para continuar.')
  })

  it('status sem frase própria e erros 5xx caem na mensagem padrão', () => {
    expect(traduzirErro(new ErroApi(500, 'NullPointerException')).mensagem).toBe(MENSAGEM_ERRO_PADRAO)
    expect(traduzirErro(new ErroApi(418, 'teapot')).mensagem).toBe(MENSAGEM_ERRO_PADRAO)
  })

  it('a tela troca a mensagem de um status e a de cada campo', () => {
    const erro = new ErroApi(400, 'Requisição inválida', [
      { campo: 'email', mensagem: 'must be a well-formed email address' },
      { campo: 'nome', mensagem: 'size must be between 1 and 150' },
      { campo: '', mensagem: 'global' },
    ])

    const traduzido = traduzirErro(erro, {
      porStatus: { 400: 'Confira os dados.' },
      porCampo: { email: 'Informe um e-mail válido.' },
    })

    expect(traduzido.mensagem).toBe('Confira os dados.')
    expect(traduzido.campos).toEqual({ email: 'Informe um e-mail válido.', nome: MENSAGEM_CAMPO_PADRAO })
  })

  it('aceita o resultado de uma Server Action ({ status, erros }) e qualquer outro valor', () => {
    expect(traduzirErro({ status: 422 }).mensagem).toBe(MENSAGENS_POR_STATUS[422])
    expect(traduzirErro(new Error('boom'))).toEqual({ status: -1, mensagem: MENSAGEM_ERRO_PADRAO, campos: {} })
    expect(traduzirErro(null).mensagem).toBe(MENSAGEM_ERRO_PADRAO)
  })
})
