import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ITENS_BOTTOM_NAV } from '@/constants/navegacao'
import { BottomNav } from './bottom-nav'

describe('BottomNav', () => {
  it('tem 4 abas com o + no meio e marca a ativa', () => {
    render(<BottomNav itens={ITENS_BOTTOM_NAV} ativo="/lancamentos" criarAberto={false} onCriar={vi.fn()} />)

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const nomes = [...nav.querySelectorAll('a, button')].map((el) => el.getAttribute('aria-label') ?? el.textContent)
    expect(nomes).toEqual(['Início', 'Lançamentos', 'Criar', 'Categorias', 'Perfil'])
    expect(screen.getByRole('link', { name: 'Lançamentos' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  })

  it('o + abre a folha Criar e, aberta, vira "Fechar Criar"', async () => {
    const onCriar = vi.fn()
    const { rerender } = render(<BottomNav itens={ITENS_BOTTOM_NAV} criarAberto={false} onCriar={onCriar} />)

    const criar = screen.getByRole('button', { name: 'Criar' })
    expect(criar).toHaveAttribute('aria-haspopup', 'dialog')
    expect(criar).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(criar)
    expect(onCriar).toHaveBeenCalledOnce()

    rerender(<BottomNav itens={ITENS_BOTTOM_NAV} criarAberto onCriar={onCriar} />)
    expect(screen.getByRole('button', { name: 'Fechar Criar' })).toHaveAttribute('aria-expanded', 'true')
  })
})
