import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormatoCsv } from './formato-csv'

describe('FormatoCsv', () => {
  it('mostra as colunas na ordem, o exemplo com data e o botão do modelo', async () => {
    const aoBaixar = vi.fn()
    render(<FormatoCsv onBaixarModelo={aoBaixar} />)

    const colunas = screen.getByRole('table', { name: 'Colunas, nesta ordem' })
    expect(colunas).toHaveTextContent(/descricao.*tipo.*data.*valor.*categorias/)
    expect(screen.getByText(/Mercado do mês;DESPESA;05\/11\/2026;1.120,35;Mercado/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Baixar modelo CSV' }))
    expect(aoBaixar).toHaveBeenCalledOnce()
  })
})
