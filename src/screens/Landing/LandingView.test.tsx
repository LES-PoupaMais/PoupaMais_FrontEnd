import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LandingProvider, useLandingContext } from './LandingContext'
import { LandingView } from './LandingView'

describe('Landing', () => {
  it('apresenta o PoupaMais, leva ao cadastro e ao login e tem o rodapé do site', () => {
    render(
      <LandingProvider>
        <LandingView />
      </LandingProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /Veja para onde vai o seu dinheiro/ })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getAllByRole('link', { name: 'Criar conta' })[0]).toHaveAttribute(
      'href',
      '/cadastro',
    )
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
    expect(screen.getByRole('navigation', { name: 'Links do rodapé' })).toBeInTheDocument()
  })

  it('o Context exige o Provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useLandingContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<LandingProvider>/)
  })
})
