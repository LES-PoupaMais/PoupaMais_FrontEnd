import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormatoCsv } from './formato-csv'

describe('FormatoCsv', () => {
  it('mostra as colunas na ordem, o exemplo com data e o link do modelo', () => {
    render(<FormatoCsv modeloHref="/api/lancamentos/template-csv" />)

    const colunas = screen.getByRole('table', { name: 'Colunas, nesta ordem' })
    expect(colunas).toHaveTextContent(/descricao.*tipo.*data.*valor.*categorias/)
    expect(screen.getByText(/Mercado do mês;DESPESA;05\/11\/2026;1.120,35;Mercado/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Baixar modelo CSV' })).toHaveAttribute('download')
  })
})
