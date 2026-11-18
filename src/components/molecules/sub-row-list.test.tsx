import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SubRow, SubRowList } from './sub-row-list'

const partes = [
  { nome: 'Luz', valor: 186.4 },
  { nome: 'Internet', valor: '127.80' },
  { nome: 'Água', valor: 98.15 },
]

describe('SubRowList', () => {
  it('abre e fecha as sub-linhas pelo botão do pai, com a soma que fecha', async () => {
    render(
      <SubRowList>
        <SubRow
          nome="Contas de casa"
          meta="10 nov · 3 itens"
          valor={412.35}
          tipo="DESPESA"
          filhos={partes}
          mostrarSoma
        />
      </SubRowList>,
    )
    const pai = screen.getByRole('button', { name: /Contas de casa/ })
    expect(pai).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Luz')).not.toBeVisible()

    await userEvent.click(pai)
    expect(pai).toHaveAttribute('aria-expanded', 'true')
    const filhos = document.getElementById(pai.getAttribute('aria-controls')!)!
    expect(filhos).toBeVisible()
    expect(screen.getByText('Luz')).toBeVisible()
    expect(screen.getByText(/R\$\s412,35 · fecha com o total/)).toBeVisible()
    expect(pai).toHaveTextContent('Despesa')
  })

  it('mostra quanto falta ou passou quando a soma não fecha', () => {
    const { rerender } = render(
      <SubRow
        nome="Salário"
        valor={9800}
        tipo="RECEITA"
        filhos={[{ nome: 'Base', valor: 9200 }]}
        abertoInicial
        mostrarSoma
      />,
    )
    expect(screen.getByText(/faltam R\$\s600,00/)).toBeInTheDocument()
    rerender(
      <SubRow
        nome="Salário"
        valor={9800}
        tipo="RECEITA"
        filhos={[{ nome: 'Base', valor: 9900 }]}
        abertoInicial
        mostrarSoma
      />,
    )
    expect(screen.getByText(/passou R\$\s100,00 do total/)).toBeInTheDocument()
  })
})
