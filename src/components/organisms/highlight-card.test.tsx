import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HighlightCard } from './highlight-card'

describe('HighlightCard', () => {
  it('saldo positivo: sinal, mês e a mensagem da API', () => {
    render(<HighlightCard saldo={4920} mes={11} ano={2026} mensagem="Você fechou o mês com R$ 4.920,00 positivos." />)
    const card = screen.getByRole('article', { name: 'Saldo do mês de novembro de 2026' })
    expect(card).toHaveAttribute('data-sinal', 'positivo')
    expect(card).toHaveTextContent('positivo, + R$ 4.920,00')
    expect(card).toHaveTextContent('Novembro 2026')
    expect(card).toHaveTextContent('Você fechou o mês com R$ 4.920,00 positivos.')
  })

  it('saldo negativo com "−" e zero sem sinal', () => {
    const { rerender } = render(<HighlightCard saldo={-750.4} mes={7} ano={2026} />)
    expect(screen.getByRole('article')).toHaveAttribute('data-sinal', 'negativo')
    expect(screen.getByRole('article')).toHaveTextContent('negativo, − R$ 750,40')

    // Zero é neutro (prancheta dashboard-vazio): sem "positivo", sem sinal
    rerender(<HighlightCard saldo={0} mes={1} ano={2026} />)
    expect(screen.getByRole('article')).toHaveAttribute('data-sinal', 'zero')
    expect(screen.getByRole('article')).toHaveTextContent(/^Saldo do mês.*R\$ 0,00$/)
    expect(screen.getByRole('article')).not.toHaveTextContent('positivo')
  })

  it('carregando mostra o esqueleto escondido do leitor de tela', () => {
    const { container } = render(<HighlightCard saldo={0} mes={1} ano={2026} carregando />)
    expect(container.querySelector('[data-slot="highlight-card"]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  })
})
