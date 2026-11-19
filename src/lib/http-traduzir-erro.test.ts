import { describe, expect, it } from 'vitest'
import {
  ErroApi,
  ehSessaoVencida,
  MENSAGEM_CAMPO_PADRAO,
  MENSAGEM_ERRO_PADRAO,
  MENSAGEM_SEM_CONEXAO,
  MENSAGENS_POR_STATUS,
  traduzirErro,
} from './http'

// Regra de 19/11/2026: a mensagem da API vai como veio; o front não deduz a causa pelo texto nem pelo status.
describe('traduzirErro (lib/http)', () => {
  it('mostra a mensagem que a API mandou, como veio', () => {
    const erro = new ErroApi(422, 'A categoria "Lazer" está inativa e não pode ser usada', [], true)
    expect(traduzirErro(erro)).toEqual({
      status: 422,
      mensagem: 'A categoria "Lazer" está inativa e não pode ser usada',
      campos: {},
    })
    expect(traduzirErro({ status: 422, mensagem: 'A senha atual está incorreta', erros: [] }).mensagem).toBe(
      'A senha atual está incorreta',
    )
  })

  it('cada erros[] com campo vai para o seu campo com a mensagem da API', () => {
    const erro = new ErroApi(
      400,
      'Dados inválidos',
      [
        { campo: 'data', mensagem: 'Informe uma data que exista' },
        { campo: 'nome', mensagem: '' },
        { campo: '', mensagem: 'global' },
      ],
      true,
    )
    expect(traduzirErro(erro)).toEqual({
      status: 400,
      mensagem: 'Dados inválidos',
      campos: { data: 'Informe uma data que exista', nome: MENSAGEM_CAMPO_PADRAO },
    })
  })

  it('sem mensagem da API: a frase do status (ou a da tela), senão a genérica', () => {
    expect(traduzirErro(new ErroApi(409, MENSAGEM_ERRO_PADRAO)).mensagem).toBe(MENSAGENS_POR_STATUS[409])
    expect(traduzirErro({ status: 409 }, { porStatus: { 409: 'Já existe.' } }).mensagem).toBe('Já existe.')
    expect(traduzirErro({ status: 418, mensagem: '' }).mensagem).toBe(MENSAGEM_ERRO_PADRAO)
    // A frase da tela não passa por cima da mensagem da API
    expect(traduzirErro({ status: 409, mensagem: 'Da API' }, { porStatus: { 409: 'Da tela' } }).mensagem).toBe('Da API')
  })

  it('sem conexão, sessão vencida e 5xx: sempre as frases do front, mesmo com mensagem da API', () => {
    expect(traduzirErro(new ErroApi(0, 'x')).mensagem).toBe(MENSAGEM_SEM_CONEXAO)
    expect(traduzirErro(new ErroApi(401, 'Sessão inválida', [], true)).mensagem).toBe(
      'Sua sessão venceu. Entre de novo para continuar.',
    )
    expect(traduzirErro(new ErroApi(500, 'NullPointerException', [], true))).toEqual({
      status: 500,
      mensagem: MENSAGEM_ERRO_PADRAO,
      campos: {},
    })
    expect(traduzirErro(new ErroApi(503, 'x', [{ campo: 'a', mensagem: 'b' }], true)).mensagem).toBe(
      MENSAGENS_POR_STATUS[503],
    )
  })

  it('frase genérica da tela (padrao): sem mensagem da API e em 5xx; nunca no lugar de sem conexão e sessão', () => {
    const opcoes = { padrao: 'Não foi possível salvar o nome.' }
    expect(traduzirErro({ status: 422 }, opcoes).mensagem).toBe(opcoes.padrao)
    expect(traduzirErro({ status: 500 }, opcoes).mensagem).toBe(opcoes.padrao)
    expect(traduzirErro({ status: 503 }, opcoes).mensagem).toBe(MENSAGENS_POR_STATUS[503])
    expect(traduzirErro({ status: 0 }, opcoes).mensagem).toBe(MENSAGEM_SEM_CONEXAO)
    expect(traduzirErro({ status: 422, mensagem: 'Da API' }, opcoes).mensagem).toBe('Da API')
  })

  it('só tem frase para os status que o back manda', () => {
    expect(Object.keys(MENSAGENS_POR_STATUS).map(Number)).toEqual([0, 400, 401, 404, 409, 422, 503])
  })

  it('qualquer outro valor cai na genérica; ehSessaoVencida', () => {
    expect(traduzirErro(new Error('boom'))).toEqual({ status: -1, mensagem: MENSAGEM_ERRO_PADRAO, campos: {} })
    expect(traduzirErro(null).mensagem).toBe(MENSAGEM_ERRO_PADRAO)
    expect(ehSessaoVencida(new ErroApi(401, 'x'))).toBe(true)
    expect(ehSessaoVencida({ status: 422 })).toBe(false)
    expect(ehSessaoVencida('x')).toBe(false)
  })
})
