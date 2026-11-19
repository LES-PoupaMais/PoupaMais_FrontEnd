import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PublicTemplate } from './public-template'

describe('PublicTemplate', () => {
  it('segue o tema e oferece Entrar e Criar conta', () => {
    const { container } = render(<PublicTemplate>conteúdo</PublicTemplate>)

    expect(container.firstChild).not.toHaveClass('dark')
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
    expect(screen.getByRole('main')).toHaveTextContent('conteúdo')
  })

  it('variante site: topo com outras ações e rodapé completo', () => {
    render(
      <PublicTemplate variante="site" acoes={<a href="/login">Entrar agora</a>}>
        conteúdo
      </PublicTemplate>,
    )

    expect(screen.getByRole('link', { name: 'Entrar agora' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Links do rodapé' })).toBeInTheDocument()
    expect(screen.getByText(/Finanças pessoais e familiares, mês a mês/)).toBeInTheDocument()
  })

  it('sem ações nem rodapé (404) e com outro destino para o logo', () => {
    render(
      <PublicTemplate acoes={null} rodape={null} hrefLogo="/dashboard">
        conteúdo
      </PublicTemplate>,
    )

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PoupaMais, ir para a página inicial' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })
})
