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
