import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginProvider, useLoginContext } from './LoginContext'
import { LoginSkeleton } from './LoginSkeleton'
import { LoginView } from './LoginView'

const renderizar = (voltar?: string) =>
  render(
    <LoginProvider voltar={voltar}>
      <LoginView />
    </LoginProvider>,
  )

describe('Login (placeholder)', () => {
  it('mostra o título e o caminho para criar conta', () => {
    renderizar()

    expect(screen.getByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })

  it('guarda o destino interno e ignora destino externo', () => {
    const { unmount } = renderizar('/lancamentos/novo')
    expect(screen.getByText(/formulário de login/)).toHaveAttribute('data-voltar-para', '/lancamentos/novo')
    unmount()

    renderizar('https://site.com')
    expect(screen.getByText(/formulário de login/)).toHaveAttribute('data-voltar-para', '/dashboard')
  })

  it('o esqueleto mostra o carregamento e o Context exige o Provider', () => {
    render(<LoginSkeleton />)
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()

    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useLoginContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<LoginProvider>/)
  })
})
