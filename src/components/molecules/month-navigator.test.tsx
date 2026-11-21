import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonthNavigator } from './month-navigator'

describe('MonthNavigator', () => {
  it('mostra o mês por extenso e troca para o anterior e o próximo, anunciando a troca', async () => {
    const onChange = vi.fn()
    render(<MonthNavigator mes={1} ano={2026} onChange={onChange} />)

    const nav = screen.getByRole('navigation', { name: 'Mês exibido' })
    expect(nav).toHaveTextContent('Janeiro 2026')

    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(onChange).toHaveBeenLastCalledWith({ mes: 12, ano: 2025 })
    expect(nav).toHaveTextContent('Mostrando Dezembro de 2025')

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(onChange).toHaveBeenLastCalledWith({ mes: 2, ano: 2026 })
  })

  it('compacto abrevia o mês; com seletor "folha" o nome abre a folha do calendário na visão de meses', async () => {
    const onChange = vi.fn()
    render(
      <MonthNavigator variante="compacto" seletor="folha" mes={11} ano={2026} onChange={onChange} hoje="2026-11-20" />,
    )

    const nome = screen.getByRole('button', { name: 'Novembro de 2026. Escolher outro mês' })
    expect(nome).toHaveTextContent('Nov 2026')
    expect(nome).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(nome)

    const folha = screen.getByRole('dialog', { name: 'Mês exibido' })
    await userEvent.click(within(folha).getByRole('button', { name: /março/i }))
    expect(onChange).toHaveBeenLastCalledWith({ mes: 3, ano: 2026 })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Mês exibido' })).toHaveTextContent('Mostrando Março de 2026')
  })

  it('com seletor "popover" troca de ano e de mês; escolher o mesmo mês só fecha', async () => {
    const onChange = vi.fn()
    render(<MonthNavigator seletor="popover" mes={11} ano={2026} onChange={onChange} hoje="2026-11-20" />)

    await userEvent.click(screen.getByRole('button', { name: 'Novembro de 2026. Escolher outro mês' }))
    let painel = screen.getByRole('dialog', { name: 'Mês exibido' })
    await userEvent.click(within(painel).getByRole('button', { name: /novembro/i }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Novembro de 2026. Escolher outro mês' }))
    painel = screen.getByRole('dialog', { name: 'Mês exibido' })
    await userEvent.click(within(painel).getByRole('button', { name: 'Próximo ano' }))
    await userEvent.click(within(painel).getByRole('button', { name: /janeiro/i }))
    expect(onChange).toHaveBeenLastCalledWith({ mes: 1, ano: 2027 })
  })

  it('sem seletor, o nome é só texto', () => {
    render(<MonthNavigator mes={11} ano={2026} onChange={vi.fn()} contornado />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('desabilita as setas nos limites de jan/2000 e dez/2100', () => {
    const { rerender } = render(<MonthNavigator mes={12} ano={2100} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeEnabled()

    rerender(<MonthNavigator mes={1} ano={2000} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
  })
})
