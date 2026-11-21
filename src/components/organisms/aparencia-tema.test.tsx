import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AparenciaTema } from './aparencia-tema'

describe('AparenciaTema', () => {
  it('marca o tema atual e troca pelo radio', async () => {
    const onTemaChange = vi.fn()
    render(<AparenciaTema tema="system" onTemaChange={onTemaChange} />)
    expect(screen.getByRole('radiogroup', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked()
    expect(screen.getByText(/A escolha vale neste navegador/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Escuro' }))
    expect(onTemaChange).toHaveBeenCalledWith('dark')
  })

  it('antes de saber o tema, nenhuma opção marcada', () => {
    render(<AparenciaTema tema={null} onTemaChange={vi.fn()} />)
    for (const nome of ['Sistema', 'Claro', 'Escuro'])
      expect(screen.getByRole('radio', { name: nome })).not.toBeChecked()
  })
})
