import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { lerPeriodo } from '@/lib/periodo'
import { lerFiltros } from '@/screens/Lancamentos/filtrosDaUrl'
import { CategoryBarChart, hrefDaCategoria } from './category-bar-chart'

const dados = [
  { categoriaId: 2, descricao: 'Mercado', valor: 1480.35 },
  { categoriaId: 1, descricao: 'Aluguel', valor: 2200 },
  { categoriaId: 9, descricao: 'Outros', valor: 202 },
]

describe('CategoryBarChart', () => {
  it('ordena da maior para a menor e cada linha leva a Lançamentos filtrado pela categoria e mês', () => {
    render(<CategoryBarChart dados={dados} total={7560.5} mes={11} ano={2026} />)
    const secao = screen.getByRole('region', { name: 'Despesas por categoria' })
    expect(secao).toHaveTextContent('Nov/2026')
    expect(secao).toHaveTextContent('Total de despesas: R$ 7.560,50')

    const links = within(secao).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('aria-label')?.replace(/\s/g, ' '))).toEqual([
      'Aluguel: R$ 2.200,00. Ver lançamentos de Aluguel',
      'Mercado: R$ 1.480,35. Ver lançamentos de Mercado',
      'Outros: R$ 202,00. Ver lançamentos de Outros',
    ])
    expect(links[1]).toHaveAttribute('href', '/lancamentos?categoria=2&mes=11&ano=2026&tipo=DESPESA')
    expect(secao).toHaveTextContent('Tocar numa categoria abre Lançamentos filtrados por ela.')
  })

  it('sem despesas mostra o estado vazio e nenhuma barra', () => {
    render(<CategoryBarChart dados={[]} total={0} mes={11} ano={2026} />)
    expect(screen.getByRole('heading', { name: 'Não há informações disponíveis para o período' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('carregando e o link montado', () => {
    const { container } = render(<CategoryBarChart dados={[]} total={0} mes={1} ano={2026} carregando />)
    // Esqueleto de lista (prancheta dashboard-carregando-celular): título + 4 linhas de rótulo e barra
    const esqueleto = container.querySelector('[data-slot="lista-carregando"]')
    expect(esqueleto).toHaveAttribute('aria-hidden', 'true')
    expect(esqueleto?.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(9)
    expect(hrefDaCategoria(4, 1, 2027)).toBe('/lancamentos?categoria=4&mes=1&ano=2027&tipo=DESPESA')
  })

  it('o link usa os parâmetros que a tela de Lançamentos lê (categoria, tipo e mês aplicados)', () => {
    const busca = new URL(hrefDaCategoria(2, 11, 2026), 'http://localhost').searchParams
    expect(lerFiltros(busca)).toEqual({ q: '', tipo: 'DESPESA', status: null, categoriaId: 2 })
    expect(lerPeriodo(busca)).toMatchObject({ mes: 11, ano: 2026 })
  })
})
