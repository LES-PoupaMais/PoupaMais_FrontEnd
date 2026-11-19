import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { lancamentosDemo } from '@/test/msw/server-e-dados'
import type { Lancamento } from '@/types/api'
import { TransactionRow, TransactionRowList, dataDaLinha } from './transaction-row'

const mercado = lancamentosDemo.find((l) => l.id === 3) as Lancamento

describe('TransactionRow', () => {
  it('mostra descrição, valor com o tipo em texto, data curta e categorias; a linha é um link "Ver"', () => {
    render(
      <TransactionRowList>
        <li>
          <TransactionRow lancamento={mercado} href="/lancamentos/3" />
        </li>
      </TransactionRowList>,
    )
    const link = screen.getByRole('link', { name: 'Ver Mercado do mês' })
    expect(link).toHaveAttribute('href', '/lancamentos/3')
    expect(screen.getByText('Despesa,')).toBeInTheDocument()
    expect(screen.getByText(/R\$ 1\.120,35/)).toBeInTheDocument()
    expect(screen.getByText('5 nov')).toHaveAttribute('datetime', '2026-11-05')
    expect(screen.getByText('Mercado')).toBeInTheDocument()
    expect(screen.queryByText('Fora do saldo')).not.toBeInTheDocument()
  })

  it('fora do saldo: selo "Fora do saldo"; até 2 categorias e "+N"', () => {
    const inativo: Lancamento = {
      ...mercado,
      status: 'INATIVO',
      categorias: [
        { id: 1, descricao: 'A' },
        { id: 2, descricao: 'B' },
        { id: 3, descricao: 'C' },
      ],
    }
    const { container } = render(<TransactionRow lancamento={inativo} href="/x" />)
    expect(screen.getByText('Fora do saldo')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('e mais 1')).toBeInTheDocument()
    expect(container.querySelector('[data-status="INATIVO"]')).not.toBeNull()
  })

  it('na lixeira: data com ano, selo e Restaurar sem abrir a visualização', async () => {
    const onRestaurar = vi.fn()
    const onAbrir = vi.fn()
    render(
      <TransactionRow
        lancamento={{ ...mercado, status: 'DELETADO' }}
        href="/x"
        comAno
        onAbrir={onAbrir}
        onRestaurar={onRestaurar}
      />,
    )
    expect(screen.getByText('5 nov 2026')).toBeInTheDocument()
    expect(screen.getByText('Na lixeira')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar Mercado do mês' }))
    expect(onRestaurar).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
    expect(onAbrir).not.toHaveBeenCalled()
  })

  it('Restaurar fica desabilitado com o motivo sem internet', async () => {
    const onRestaurar = vi.fn()
    render(
      <TransactionRow
        lancamento={{ ...mercado, status: 'DELETADO' }}
        href="/x"
        onRestaurar={onRestaurar}
        motivoDesabilitado="motivo"
      />,
    )
    const botao = screen.getByRole('button', { name: 'Restaurar Mercado do mês' })
    expect(botao).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(botao)
    expect(onRestaurar).not.toHaveBeenCalled()
  })

  it('onAbrir recebe o lançamento e o evento do clique', async () => {
    const onAbrir = vi.fn((_l, evento: React.MouseEvent) => evento.preventDefault())
    render(<TransactionRow lancamento={mercado} href="/x" onAbrir={onAbrir} />)
    await userEvent.click(screen.getByRole('link', { name: 'Ver Mercado do mês' }))
    expect(onAbrir).toHaveBeenCalledWith(mercado, expect.anything())
  })

  it('dataDaLinha: "18 nov" ou "18 nov 2026"', () => {
    expect(dataDaLinha('2026-11-18')).toBe('18 nov')
    expect(dataDaLinha('2026-11-18', true)).toBe('18 nov 2026')
  })
})
