import { describe, expect, it } from 'vitest'
import { FILTROS_VAZIOS } from '@/components/organisms/filter-bar'
import { comFiltros, lerFiltros, lerVer, origemParaExportar, paraApi } from './filtrosDaUrl'

describe('filtros na URL', () => {
  it('lê e ignora valores inválidos', () => {
    expect(lerFiltros(new URLSearchParams('tipo=X&status=DELETADO&categoria=abc'))).toEqual(FILTROS_VAZIOS)
    expect(lerVer(new URLSearchParams('ver=-1'))).toBeUndefined()
    expect(lerVer(new URLSearchParams('ver=7'))).toBe(7)
  })

  it('escreve preservando o mês e tira o que ficou vazio', () => {
    expect(comFiltros('mes=11&ano=2026&tipo=RECEITA', { ...FILTROS_VAZIOS, q: ' feira ', categoriaId: 3 })).toBe(
      'mes=11&ano=2026&q=feira&categoria=3',
    )
  })

  it('paraApi e origem do exportar', () => {
    expect(paraApi({ ...FILTROS_VAZIOS, status: 'ATIVO' }, { mes: 1, ano: 2026 })).toEqual({
      mes: 1,
      ano: 2026,
      descricao: undefined,
      tipo: undefined,
      status: 'ATIVO',
      categoriaId: undefined,
    })
    const periodo = { mes: 11, ano: 2026 }
    expect(origemParaExportar({ ...FILTROS_VAZIOS, status: 'ATIVO' }, periodo)).toContain('só os que contam')
    expect(origemParaExportar({ ...FILTROS_VAZIOS, status: 'INATIVO' }, periodo)).toContain('não contam')
  })
})
