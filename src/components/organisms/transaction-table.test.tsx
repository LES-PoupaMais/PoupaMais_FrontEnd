import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { lancamentosDemo } from '@/test/msw/server-e-dados'
import { TransactionTable, type TransactionTableProps } from './transaction-table'

const base: TransactionTableProps = {
  lancamentos: lancamentosDemo,
  titulo: 'Novembro 2026',
  legenda: 'Todos os status',
  descricaoTabela: 'Lançamentos de novembro de 2026',
  hrefDe: (l) => `/lancamentos/${l.id}`,
}

describe('TransactionTable', () => {
  it('colunas, datas dd/mm/aaaa, links "Ver" e região rolável rotulada pelo título', () => {
    render(<TransactionTable {...base} hrefEditar={(l) => `/lancamentos/${l.id}/editar`} />)
    const tabela = screen.getByRole('table', { name: 'Lançamentos de novembro de 2026' })
    const cabecalhos = within(tabela)
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(cabecalhos).toEqual([
      'Descrição',
      'Data',
      'Categorias',
      'Tipo',
      'Valor',
      'Conta no saldoO que é Conta no saldo',
      'Ações',
    ])
    expect(screen.getByRole('region', { name: 'Novembro 2026' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('link', { name: 'Ver Salário' })).toHaveAttribute('href', '/lancamentos/2')
    expect(screen.getByRole('link', { name: 'Editar Salário' })).toHaveAttribute('href', '/lancamentos/2/editar')
    expect(screen.getAllByText('05/11/2026')).toHaveLength(2)
  })

  it('switch "Conta no saldo" e mover para a lixeira chamam os callbacks sem abrir a visualização', async () => {
    const onAlternarSaldo = vi.fn()
    const onMoverParaLixeira = vi.fn()
    const onAbrir = vi.fn()
    render(
      <TransactionTable
        {...base}
        onAbrir={onAbrir}
        onAlternarSaldo={onAlternarSaldo}
        onMoverParaLixeira={onMoverParaLixeira}
        ocupados={new Set([4])}
      />,
    )
    const salario = screen.getByRole('switch', { name: 'Conta no saldo: Salário' })
    expect(salario).toBeChecked()
    await userEvent.click(salario)
    expect(onAlternarSaldo).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), false)
    expect(screen.getByRole('switch', { name: 'Conta no saldo: Freelance de design' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Mover Salário para a lixeira' }))
    expect(onMoverParaLixeira).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
    expect(onAbrir).not.toHaveBeenCalled()
  })

  it('sem internet: switch desabilitado e lixeira não age', async () => {
    const onMoverParaLixeira = vi.fn()
    render(<TransactionTable {...base} onMoverParaLixeira={onMoverParaLixeira} motivoDesabilitado="m" />)
    expect(screen.getByRole('switch', { name: 'Conta no saldo: Salário' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Mover Salário para a lixeira' }))
    expect(onMoverParaLixeira).not.toHaveBeenCalled()
  })

  it('lixeira: sem switch e sem Editar, com Restaurar; rodapé e dica', async () => {
    const onRestaurar = vi.fn()
    render(
      <TransactionTable
        {...base}
        modo="lixeira"
        lancamentos={lancamentosDemo.map((l) => ({ ...l, status: 'DELETADO' as const }))}
        onRestaurar={onRestaurar}
        ocupados={new Set([5])}
        rodape={<span>Mostrando 5 de 9</span>}
        dica="Clique numa linha"
      />,
    )
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurar Feira e padaria' })).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar Salário' }))
    expect(onRestaurar).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
    expect(screen.getByText('Mostrando 5 de 9')).toBeInTheDocument()
    expect(screen.getByText('Clique numa linha')).toBeInTheDocument()
  })
})
