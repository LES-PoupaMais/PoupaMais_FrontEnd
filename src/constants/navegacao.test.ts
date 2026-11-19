import { describe, expect, it } from 'vitest'
import { GRUPOS_SIDEBAR, ITENS_BOTTOM_NAV, itemAtivo } from './navegacao'

const itensSidebar = GRUPOS_SIDEBAR.flatMap((grupo) => grupo.itens)

describe('navegação', () => {
  it('na sidebar, a Lixeira tem item próprio', () => {
    expect(itemAtivo(itensSidebar, '/lancamentos/lixeira')).toBe('/lancamentos/lixeira')
    expect(itemAtivo(itensSidebar, '/lancamentos/10/editar')).toBe('/lancamentos')
    expect(itemAtivo(itensSidebar, '/dashboard')).toBe('/dashboard')
  })

  it('na barra inferior, subtelas de Lançamentos marcam Lançamentos', () => {
    expect(itemAtivo(ITENS_BOTTOM_NAV, '/lancamentos/lixeira')).toBe('/lancamentos')
    expect(itemAtivo(ITENS_BOTTOM_NAV, '/lancamentos/novo')).toBe('/lancamentos')
  })

  it('não marca nada fora da área logada e não confunde prefixos', () => {
    expect(itemAtivo(ITENS_BOTTOM_NAV, '/login')).toBeUndefined()
    expect(itemAtivo(ITENS_BOTTOM_NAV, '/perfilx')).toBeUndefined()
  })
})

describe('rotas', () => {
  it('monta as rotas de um lançamento', async () => {
    const { ROTAS } = await import('./rotas')
    expect(ROTAS.lancamento(3)).toBe('/lancamentos/3')
    expect(ROTAS.editarLancamento(3)).toBe('/lancamentos/3/editar')
  })
})

describe('topo do celular e barra inferior', async () => {
  const { escondeBottomNav, topoDaRota } = await import('./navegacao')

  it('Início e Lançamentos mostram o mês; Categorias e Perfil não', () => {
    expect(topoDaRota('/dashboard')).toEqual({ titulo: 'Início', mostrarMes: true })
    expect(topoDaRota('/lancamentos')).toEqual({ titulo: 'Lançamentos', mostrarMes: true })
    expect(topoDaRota('/categorias').mostrarMes).toBe(false)
    expect(topoDaRota('/perfil').titulo).toBe('Perfil')
  })

  it('subtelas de Lançamentos voltam para Lançamentos, sem mês', () => {
    for (const [caminho, titulo] of [
      ['/lancamentos/lixeira', 'Lixeira'],
      ['/lancamentos/novo', 'Novo lançamento'],
      ['/lancamentos/importar', 'Importar CSV'],
      ['/lancamentos/7/editar', 'Editar lançamento'],
      ['/lancamentos/7', 'Lançamento'],
    ]) {
      expect(topoDaRota(caminho)).toEqual({
        titulo,
        mostrarMes: false,
        voltar: { href: '/lancamentos', destino: 'Lançamentos' },
      })
    }
  })

  it('rota desconhecida mostra só o nome do app', () => {
    expect(topoDaRota('/outra')).toEqual({ titulo: 'PoupaMais', mostrarMes: false })
  })

  it('só os formulários escondem a barra inferior', () => {
    expect(escondeBottomNav('/lancamentos/novo')).toBe(true)
    expect(escondeBottomNav('/lancamentos/3/editar')).toBe(true)
    expect(escondeBottomNav('/lancamentos/importar')).toBe(true)
    expect(escondeBottomNav('/lancamentos/3')).toBe(false)
    expect(escondeBottomNav('/lancamentos/lixeira')).toBe(false)
  })
})
