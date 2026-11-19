import { describe, expect, it } from 'vitest'
import { caminhoDoBff } from './bff-rotas'

const segmentos = (caminho: string) => caminho.split('/')

describe('caminhoDoBff', () => {
  it.each([
    'lancamentos',
    'lancamentos/3',
    'lancamentos/3/status',
    'lancamentos/3/restaurar',
    'lancamentos/importar',
    'lancamentos/exportar',
    'lancamentos/template-csv',
    'categorias',
    'categorias/2',
    'categorias/2/status',
    'dashboard',
    'usuarios/me',
    'usuarios/me/foto',
    'usuarios/me/dados',
    'auth/recuperar-senha',
    'auth/redefinir-senha',
  ])('repassa %s (usado pelos services/)', (caminho) => {
    expect(caminhoDoBff(segmentos(caminho))).toBe(caminho)
  })

  it.each([
    'auth/login',
    'auth/cadastro',
    'auth/qualquer',
    'auth',
    'usuarios/me/senha',
    'usuarios/me/excluir',
    'usuarios',
    'usuarios/2',
    'actuator/health',
    'dashboard/x',
    'lancamentosx',
  ])('bloqueia %s', (caminho) => {
    expect(caminhoDoBff(segmentos(caminho))).toBeNull()
  })

  it.each([
    [[]],
    [['lancamentos', '']],
    [['lancamentos', '.']],
    [['lancamentos', '..', 'usuarios', 'me', 'senha']],
    [['lancamentos', '%2e%2e', 'auth', 'login']],
    [['lancamentos', '%2E']],
    [['lancamentos', '%252e%252e']],
    [['lancamentos', '..%2f..%2fauth']],
    [['lancamentos', 'a%2Fb']],
    [['lancamentos', 'a\\b']],
    [['lancamentos', '%E0%A4%A']],
  ])('recusa segmento vazio, ponto, ponto-ponto, barra ou codificação inválida: %j', (lista) => {
    expect(caminhoDoBff(lista)).toBeNull()
  })

  it('codifica de novo os segmentos ao montar o caminho', () => {
    expect(caminhoDoBff(['lancamentos', 'a b'])).toBe('lancamentos/a%20b')
  })
})
