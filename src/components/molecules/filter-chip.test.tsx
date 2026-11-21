import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChipGroup } from './chip'
import { FilterChip } from './filter-chip'

describe('FilterChip', () => {
  it('filtro: botão com aria-pressed que alterna', async () => {
    const aoMudar = vi.fn()
    const { rerender } = render(
      <FilterChip pressed={false} onPressedChange={aoMudar}>
        Receitas
      </FilterChip>,
    )
    const chip = screen.getByRole('button', { name: 'Receitas' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(chip)
    expect(aoMudar).toHaveBeenCalledWith(true)

    rerender(
      <FilterChip pressed onPressedChange={aoMudar}>
        Receitas
      </FilterChip>,
    )
    expect(screen.getByRole('button', { name: 'Receitas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Receitas' }).querySelector('svg')).not.toBeNull()
  })

  it('seleção: role checkbox dentro de um grupo com rótulo', async () => {
    const aoMudar = vi.fn()
    render(
      <ChipGroup role="group" aria-label="Formas de pagamento">
        <FilterChip papel="selecao" pressed onPressedChange={aoMudar}>
          Pix
        </FilterChip>
      </ChipGroup>,
    )

    const chip = screen.getByRole('checkbox', { name: 'Pix' })
    expect(chip).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(chip)
    expect(aoMudar).toHaveBeenCalledWith(false)
  })

  it('onClick de quem usa pode impedir a troca', async () => {
    const aoMudar = vi.fn()
    render(
      <FilterChip pressed={false} onPressedChange={aoMudar} onClick={(e) => e.preventDefault()}>
        Lixeira
      </FilterChip>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Lixeira' }))
    expect(aoMudar).not.toHaveBeenCalled()
  })
})
