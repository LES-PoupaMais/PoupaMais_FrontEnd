import { render, screen } from '@testing-library/react'
import { EyeOff } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'

describe('Badge', () => {
  it.each(['receita', 'despesa', 'atencao', 'erro', 'neutro', 'contorno'] as const)(
    'mostra o texto na variante %s',
    (variant) => {
      render(<Badge variant={variant}>Fora do saldo</Badge>)
      expect(screen.getByText('Fora do saldo')).toHaveAttribute('data-variant', variant)
    },
  )

  it('usa neutro por padrão e aceita ícone decorativo', () => {
    render(
      <Badge>
        <EyeOff aria-hidden="true" />
        Fora do saldo
      </Badge>,
    )
    const selo = screen.getByText('Fora do saldo')
    expect(selo).toHaveAttribute('data-variant', 'neutro')
    expect(selo.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('repassa para o filho com asChild', () => {
    render(
      <Badge asChild variant="receita">
        <a href="/lancamentos">Receita</a>
      </Badge>,
    )
    expect(screen.getByRole('link', { name: 'Receita' })).toHaveAttribute('data-slot', 'badge')
  })
})
