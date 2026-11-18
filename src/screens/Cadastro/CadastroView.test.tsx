import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CadastroProvider, useCadastroContext } from './CadastroContext'
import { CadastroView } from './CadastroView'

describe('Cadastro (placeholder)', () => {
  it('mostra o título e os caminhos para entrar e para a política', () => {
    render(
      <CadastroProvider>
        <CadastroView />
      </CadastroProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getAllByRole('link', { name: 'Política de Privacidade' })[0]).toHaveAttribute('href', '/privacidade')
  })

  it('o Context exige o Provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useCadastroContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<CadastroProvider>/)
  })
})
