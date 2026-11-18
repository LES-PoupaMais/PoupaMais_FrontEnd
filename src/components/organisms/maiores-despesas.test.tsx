import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MaioresDespesas, hrefDespesasDoMes } from './maiores-despesas'

const itens = [
  { id: 1, descricao: 'Aluguel do apartamento', valor: 2200, categorias: ['Aluguel'] },
  { id: 3, descricao: 'Mercado do mês', valor: 1120.35, categorias: ['Mercado', 'Contas de casa'] },
]

describe('MaioresDespesas', () => {
  it('lista as despesas com link para o lançamento, "Ver todos" e o peso das 5 maiores', () => {
    render(
      <MaioresDespesas
        itens={itens}
        peso={{ valor: 4892.95, percentual: 64.72 }}
        totalDespesas={7560.5}
        mes={11}
        ano={2026}
      />,
    )
    const secao = screen.getByRole('region', { name: 'Maiores despesas' })
    const lista = within(secao).getByRole('list')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
    expect(within(lista).getByRole('link', { name: 'Ver Mercado do mês' })).toHaveAttribute('href', '/lancamentos/3')
    expect(lista).toHaveTextContent('Despesa, − R$ 1.120,35')
    expect(lista).toHaveTextContent('Contas de casa')
    expect(within(secao).getByRole('link', { name: 'Ver todas as maiores despesas' })).toHaveAttribute(
      'href',
      '/lancamentos?mes=11&ano=2026&tipo=DESPESA',
    )
    expect(secao).toHaveTextContent('Peso das 5 maiores')
    expect(secao).toHaveTextContent('R$ 4.892,95 de R$ 7.560,50')
    expect(within(secao).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '64,7% das despesas do mês')
  })

  it('sem despesas: estado vazio, sem "Ver todos" nem peso', () => {
    render(<MaioresDespesas itens={[]} peso={{ valor: 0, percentual: null }} totalDespesas={0} mes={11} ano={2026} />)
    expect(screen.getByRole('heading', { name: 'Não há informações disponíveis para o período' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('carregando mostra o esqueleto', () => {
    const { container } = render(
      <MaioresDespesas
        itens={[]}
        peso={{ valor: 0, percentual: null }}
        totalDespesas={0}
        mes={1}
        ano={2026}
        carregando
      />,
    )
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(hrefDespesasDoMes(1, 2027)).toBe('/lancamentos?mes=1&ano=2027&tipo=DESPESA')
  })
})
