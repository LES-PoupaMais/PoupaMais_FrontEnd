import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardSecao, MarcaDoEixo, MesDoEixo } from './dashboard-secao'

describe('DashboardSecao', () => {
  it('nomeia a seção pelo título e mostra o período ou a ação ao lado', () => {
    const { rerender } = render(
      <DashboardSecao idTitulo="t" titulo="Saldo mensal" lado="Ago a Nov/2026">
        conteúdo
      </DashboardSecao>,
    )
    expect(screen.getByRole('region', { name: 'Saldo mensal' })).toHaveTextContent('Ago a Nov/2026conteúdo')

    rerender(
      <DashboardSecao
        idTitulo="t"
        titulo="Maiores despesas"
        lado={<a href="/x">Ver todos</a>}
        cartao="a-partir-do-tablet"
      />,
    )
    expect(screen.getByRole('link', { name: 'Ver todos' })).toBeInTheDocument()
  })

  it('ticks dos eixos: mês pedido em destaque e marca em uma linha', () => {
    render(
      <svg>
        <MesDoEixo x="10" y={5} payload={{ value: 'Nov' }} ultimo="Nov" />
        <MesDoEixo x={20} y={5} payload={{ value: 'Out' }} ultimo="Nov" />
        <MarcaDoEixo x={0} y={0} payload={{ value: 5000 }} formatar={(v) => `R$ ${v / 1000} mil`} />
        <MarcaDoEixo x={0} y={0} formatar={(v) => `v${v}`} />
      </svg>,
    )
    expect(screen.getByText('Nov')).toHaveAttribute('fill', 'var(--foreground)')
    expect(screen.getByText('Out')).toHaveAttribute('fill', 'var(--muted-foreground)')
    expect(screen.getByText('R$ 5 mil')).toBeInTheDocument()
    expect(screen.getByText('v0')).toBeInTheDocument()
  })
})
