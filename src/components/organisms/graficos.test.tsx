import { render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import type { ResumoMes } from '@/types/api'
import { BalanceChart } from './balance-chart'
import { DicaDoMes, IncomeExpenseChart } from './income-expense-chart'

const novembro: ResumoMes[] = [
  { mes: 8, ano: 2026, receitas: 11900, despesas: 8320.4, saldo: 3579.6 },
  { mes: 9, ano: 2026, receitas: 12050, despesas: 9870.15, saldo: 2179.85 },
  { mes: 10, ano: 2026, receitas: 12300, despesas: 7940.8, saldo: 4359.2 },
  { mes: 11, ano: 2026, receitas: 12480.5, despesas: 7560.5, saldo: 4920 },
]
const julho: ResumoMes[] = [
  { mes: 4, ano: 2026, receitas: 11600, despesas: 8240.15, saldo: 3359.85 },
  { mes: 5, ano: 2026, receitas: 11750, despesas: 7890.6, saldo: 3859.4 },
  { mes: 6, ano: 2026, receitas: 11800, despesas: 8105.3, saldo: 3694.7 },
  { mes: 7, ano: 2026, receitas: 6200, despesas: 6950.4, saldo: -750.4 },
]

// O jsdom não mede elementos: dá ao ResponsiveContainer do Recharts uma caixa de 600×300 para ele desenhar o SVG
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    clientWidth: { configurable: true, get: () => 600 },
    clientHeight: { configurable: true, get: () => 300 },
    offsetWidth: { configurable: true, get: () => 600 },
    offsetHeight: { configurable: true, get: () => 300 },
  })
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 600, height: 300, top: 0, left: 0, right: 600, bottom: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
})

describe('IncomeExpenseChart', () => {
  it('título, período, legenda em texto e tabela acessível com os valores', () => {
    render(<IncomeExpenseChart dados={novembro} />)
    const secao = screen.getByRole('region', { name: 'Receitas × Despesas' })
    expect(secao).toHaveTextContent('Ago a Nov/2026')
    expect(within(secao).getByRole('list')).toHaveTextContent('ReceitasDespesas')

    const tabela = within(secao).getByRole('table', {
      name: 'Receitas e despesas por mês, de agosto a novembro de 2026',
    })
    const linha = within(tabela).getByRole('row', { name: /Novembro de 2026/ })
    expect(linha).toHaveTextContent('R$ 12.480,50')
    expect(linha).toHaveTextContent('R$ 7.560,50')
  })

  it('desenha o eixo do zero com 3 marcas redondas', () => {
    const { container } = render(<IncomeExpenseChart dados={novembro} />)
    const textos = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent)
    expect(textos).toEqual(expect.arrayContaining(['R$ 0', 'R$ 5 mil', 'R$ 10 mil', 'R$ 15 mil', 'Ago', 'Nov']))
  })

  it('carregando mostra o esqueleto', () => {
    const { container } = render(<IncomeExpenseChart dados={[]} carregando />)
    expect(container.querySelector('[data-slot="grafico-carregando"]')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('BalanceChart', () => {
  it('tabela com "positivo," e "negativo, menos" e a fórmula do saldo', () => {
    render(<BalanceChart dados={julho} />)
    const secao = screen.getByRole('region', { name: 'Saldo mensal' })
    expect(secao).toHaveTextContent('Abr a Jul/2026')
    expect(secao).toHaveTextContent('Saldo = receitas − despesas de cada mês.')
    const tabela = within(secao).getByRole('table', { name: 'Saldo por mês, de abril a julho de 2026' })
    expect(within(tabela).getByRole('row', { name: /Julho de 2026/ })).toHaveTextContent('negativo, menos R$ 750,40')
    expect(within(tabela).getByRole('row', { name: /Abril de 2026/ })).toHaveTextContent('positivo, R$ 3.359,85')
  })

  it('valor com sinal em cada barra e marcas abaixo do zero', () => {
    const { container } = render(<BalanceChart dados={julho} />)
    const textos = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent)
    expect(textos).toEqual(expect.arrayContaining(['+3.359,85', '−750,40', 'R$ −2 mil', 'R$ 0', 'R$ 4 mil']))
    expect(container.querySelectorAll('svg path[fill="var(--despesa-grafico)"]')).toHaveLength(1)
    expect(container.querySelectorAll('svg path[fill="var(--receita-grafico)"]')).toHaveLength(3)
  })

  it('carregando mostra o esqueleto', () => {
    const { container } = render(<BalanceChart dados={[]} carregando />)
    expect(container.querySelector('[data-slot="grafico-carregando"]')).not.toBeNull()
  })
})

describe('DicaDoMes (tooltip do gráfico de área)', () => {
  it('mostra o mês e os dois valores com centavos; fechada não mostra nada', () => {
    const linha = { ...novembro[3], rotulo: 'Nov' }
    const { container, rerender } = render(<DicaDoMes active payload={[{ payload: linha }]} />)
    expect(container).toHaveTextContent('NovReceitas: R$ 12.480,50Despesas: R$ 7.560,50')

    rerender(<DicaDoMes active={false} payload={[{ payload: linha }]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
