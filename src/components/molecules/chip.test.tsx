import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Chip, ChipAcao, ChipGroup } from './chip'

describe('Chip', () => {
  it('estático, sem botão de remover', () => {
    render(<Chip>Mercado</Chip>)

    expect(screen.getByText('Mercado')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('removível: o × tem nome com o texto do chip', async () => {
    const aoRemover = vi.fn()
    render(
      <ChipGroup aria-label="Filtros aplicados">
        <Chip ativo onRemove={aoRemover}>
          Despesas
        </Chip>
      </ChipGroup>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Remover Despesas' }))
    expect(aoRemover).toHaveBeenCalledOnce()
  })

  it('aceita um nome próprio para o × e desabilita junto', () => {
    render(
      <Chip onRemove={() => {}} removerLabel="Tirar filtro de mês" disabled>
        <strong>Novembro</strong>
      </Chip>,
    )

    expect(screen.getByRole('button', { name: 'Tirar filtro de mês' })).toBeDisabled()
  })

  it('sem texto simples, o × usa "Remover"', () => {
    render(
      <Chip onRemove={() => {}}>
        <em>Casa</em>
      </Chip>,
    )

    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument()
  })

  it('ChipAcao é um botão de criar', async () => {
    const aoClicar = vi.fn()
    render(<ChipAcao onClick={aoClicar}>Adicionar</ChipAcao>)

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(aoClicar).toHaveBeenCalledOnce()
  })
})
