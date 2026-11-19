import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PrivacidadeProvider, usePrivacidadeContext } from './PrivacidadeContext'
import { PrivacidadeView } from './PrivacidadeView'

describe('Privacidade', () => {
  it('mostra a política com o topo e o rodapé do site', () => {
    render(
      <PrivacidadeProvider>
        <PrivacidadeView />
      </PrivacidadeProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Acesso' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Links do rodapé' })).toBeInTheDocument()
  })

  it('o Context exige o Provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      usePrivacidadeContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<PrivacidadeProvider>/)
  })
})
