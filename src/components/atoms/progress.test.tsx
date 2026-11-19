import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Progress } from './progress'

describe('Progress', () => {
  it('expõe o valor e a leitura em português', () => {
    render(<Progress valor={68} textoValor="68%, faltam R$ 320,00" aria-label="Progresso" />)
    const barra = screen.getByRole('progressbar', { name: 'Progresso' })
    expect(barra).toHaveAttribute('aria-valuenow', '68')
    expect(barra).toHaveAttribute('aria-valuemax', '100')
    expect(barra).toHaveAttribute('aria-valuetext', '68%, faltam R$ 320,00')
  })

  it('limita a barra entre 0 e 100 e lê a porcentagem quando não há texto', () => {
    const { rerender } = render(<Progress valor={140} cor="despesa" aria-label="Progresso" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '100%')
    rerender(<Progress valor={Number.NaN} aria-label="Progresso" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})
