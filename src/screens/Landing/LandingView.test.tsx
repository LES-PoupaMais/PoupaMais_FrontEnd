import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LandingProvider, useLandingContext } from './LandingContext'
import { LandingView } from './LandingView'

describe('Landing (placeholder)', () => {
  it('apresenta o PoupaMais e leva ao cadastro', () => {
    render(
      <LandingProvider>
        <LandingView />
      </LandingProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /Veja para onde vai o seu dinheiro/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Começar gratuitamente' })).toHaveAttribute('href', '/cadastro')
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
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
