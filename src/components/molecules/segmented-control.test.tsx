import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl, type OpcaoSegmentada } from './segmented-control'

type Tipo = 'RECEITA' | 'DESPESA'
const TIPOS: OpcaoSegmentada<Tipo>[] = [
  { value: 'RECEITA', label: 'Receita', funcao: 'receita' },
  { value: 'DESPESA', label: 'Despesa', funcao: 'despesa' },
]

function TipoControlado({ aoMudar }: { aoMudar?: (t: Tipo) => void }) {
  const [tipo, setTipo] = useState<Tipo | null>(null)
  return (
    <SegmentedControl
      label="Tipo"
      options={TIPOS}
      value={tipo}
      bloco
      onChange={(t) => {
        setTipo(t)
        aoMudar?.(t)
      }}
    />
  )
}

describe('SegmentedControl', () => {
  it('é um radiogroup com rótulo, sem escolha inicial', () => {
    render(<TipoControlado />)

    const grupo = screen.getByRole('radiogroup', { name: 'Tipo' })
    expect(grupo).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Receita' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'Despesa' })).toHaveAttribute('aria-checked', 'false')
  })

  it('escolhe pelo clique e troca pelas setas', async () => {
    const aoMudar = vi.fn()
    render(<TipoControlado aoMudar={aoMudar} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Receita' }))
    expect(aoMudar).toHaveBeenLastCalledWith('RECEITA')
    expect(screen.getByRole('radio', { name: 'Receita' })).toHaveAttribute('aria-checked', 'true')

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Despesa' })).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(aoMudar).toHaveBeenLastCalledWith('DESPESA')
  })

  it('usa aria-label quando não há rótulo visível', async () => {
    const aoMudar = vi.fn()
    render(
      <SegmentedControl
        aria-label="Status"
        options={[
          { value: 'todos', label: 'Todos' },
          { value: 'lixeira', label: 'Lixeira', disabled: true },
        ]}
        value="todos"
        onChange={aoMudar}
      />,
    )

    expect(screen.getByRole('radiogroup', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Lixeira' })).toBeDisabled()
  })

  it('mostra o erro ligado ao grupo', () => {
    render(
      <SegmentedControl
        label="Tipo"
        required
        options={TIPOS}
        value={null}
        onChange={() => {}}
        error="Escolha Receita ou Despesa."
      />,
    )

    const grupo = screen.getByRole('radiogroup', { name: 'Tipo' })
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Escolha Receita ou Despesa.')
  })

  it('desabilitado, não troca', async () => {
    const aoMudar = vi.fn()
    render(<SegmentedControl aria-label="Tipo" options={TIPOS} value="RECEITA" onChange={aoMudar} disabled />)

    await userEvent.click(screen.getByRole('radio', { name: 'Despesa' }))
    expect(aoMudar).not.toHaveBeenCalled()
  })
})
