import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Lancamento } from '@/types/api'
import { LancamentoNaLixeira } from './lancamento-na-lixeira'

const lancamento: Lancamento = {
  id: 9,
  descricao: 'Lanche',
  tipo: 'DESPESA',
  data: '2026-11-14',
  valor: 32.5,
  status: 'DELETADO',
  categorias: [{ id: 5, descricao: 'Restaurantes' }],
  dataCadastro: '2026-11-14T16:05:00Z',
  dataAtualizacao: '2026-11-16T12:20:00Z',
  dataExclusao: '2026-11-16T12:20:00Z',
}

describe('LancamentoNaLixeira', () => {
  it('mostra o aviso, os dados e restaura', async () => {
    const onRestaurar = vi.fn()
    render(<LancamentoNaLixeira lancamento={lancamento} onRestaurar={onRestaurar} hrefLixeira="/lancamentos/lixeira" />)

    expect(screen.getByRole('status')).toHaveTextContent('Este lançamento está na lixeira e não pode ser editado.')
    expect(screen.getByRole('heading', { name: 'Lanche' })).toBeInTheDocument()
    expect(screen.getByText('Na lixeira')).toBeInTheDocument()
    expect(screen.getByText('14 de novembro de 2026')).toBeInTheDocument()
    expect(screen.getByText('Restaurantes')).toBeInTheDocument()
    expect(screen.getByText(/Movido para a lixeira em/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver a lixeira' })).toHaveAttribute('href', '/lancamentos/lixeira')

    await userEvent.click(screen.getByRole('button', { name: 'Restaurar' }))
    expect(onRestaurar).toHaveBeenCalled()
  })

  it('restaurando: botão ocupado; receita sem data de exclusão', () => {
    render(
      <LancamentoNaLixeira
        lancamento={{ ...lancamento, tipo: 'RECEITA', dataExclusao: null }}
        restaurando
        onRestaurar={vi.fn()}
        hrefLixeira="/x"
      />,
    )
    expect(screen.getByRole('button', { name: 'Restaurar' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Receita')).toBeInTheDocument()
    expect(screen.queryByText(/Movido para a lixeira em/)).toBeNull()
  })
})
