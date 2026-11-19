import { render, screen } from '@testing-library/react'
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

  it('compacto abrevia o mês; com onEscolherMes o nome vira botão que abre o seletor', async () => {
    const onEscolherMes = vi.fn()
    render(<MonthNavigator variante="compacto" mes={11} ano={2026} onChange={vi.fn()} onEscolherMes={onEscolherMes} />)

    const nome = screen.getByRole('button', { name: 'Novembro de 2026. Escolher outro mês' })
    expect(nome).toHaveTextContent('Nov 2026')
    expect(nome).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(nome)
    expect(onEscolherMes).toHaveBeenCalledOnce()
  })

  it('sem onEscolherMes, o nome é só texto', () => {
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
