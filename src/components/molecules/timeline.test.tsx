import { render, screen, within } from '@testing-library/react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Timeline } from './timeline'

// instantes sem fuso são lidos no horário local: a saída não depende do fuso da máquina
const itens = [
  {
    icone: RotateCcw,
    titulo: 'Restaurado da lixeira',
    quando: '2026-11-18T14:32:00',
    detalhe: 'Voltou como inativo, fora do saldo.',
  },
  { icone: Trash2, titulo: 'Movido para a lixeira', quando: '2026-11-12T09:05:00' },
  { id: 1, icone: Plus, titulo: 'Criado', quando: '2026-11-05T19:42:00' },
]

describe('Timeline', () => {
  it('lista ordenada com rótulo, data e hora em <time> e o primeiro em destaque', () => {
    render(<Timeline itens={itens} aria-label="Histórico, da mais recente para a mais antiga" />)
    const lista = screen.getByRole('list', { name: 'Histórico, da mais recente para a mais antiga' })
    expect(lista.tagName).toBe('OL')

    const linhas = within(lista).getAllByRole('listitem')
    expect(linhas).toHaveLength(3)
    expect(linhas[0]).toHaveAttribute('data-atual', 'true')
    expect(linhas[1]).not.toHaveAttribute('data-atual')
    expect(within(linhas[0]).getByText('Voltou como inativo, fora do saldo.')).toBeInTheDocument()

    const hora = within(linhas[2]).getByText('05/11/2026 às 19:42')
    expect(hora.tagName).toBe('TIME')
    expect(hora).toHaveAttribute('datetime', '2026-11-05T19:42:00')
  })
})
