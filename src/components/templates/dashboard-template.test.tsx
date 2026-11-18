import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardTemplate } from './dashboard-template'

const ordemDosSlots = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="dashboard-grade"] > [data-slot]')).map((el) =>
    el.getAttribute('data-slot'),
  )

describe('DashboardTemplate', () => {
  it('monta a grade na ordem do celular (saldo, indicadores, área, saldo mensal, categorias, maiores)', () => {
    const { container } = render(
      <DashboardTemplate
        cabecalho={<h1>Dashboard</h1>}
        aviso="Sem conexão"
        saldo="saldo"
        indicadores="tiles"
        receitasDespesas="área"
        saldoMensal="barras"
        categorias="categorias"
        maioresDespesas="maiores"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    expect(ordemDosSlots(container)).toEqual([
      'dashboard-saldo',
      'dashboard-indicadores',
      'dashboard-receitas-despesas',
      'dashboard-saldo-mensal',
      'dashboard-categorias',
      'dashboard-maiores-despesas',
    ])
  })

  it('não cria célula vazia para slot não informado', () => {
    const { container } = render(<DashboardTemplate saldo="saldo" />)

    expect(ordemDosSlots(container)).toEqual(['dashboard-saldo'])
    expect(container.querySelector('[data-slot="dashboard-cabecalho"]')).toBeNull()
  })

  it('o estado (vazio ou erro) substitui a grade inteira', () => {
    const { container } = render(<DashboardTemplate saldo="saldo" estado="Não há lançamentos neste mês" />)

    expect(screen.getByText('Não há lançamentos neste mês')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="dashboard-grade"]')).toBeNull()
  })
})
