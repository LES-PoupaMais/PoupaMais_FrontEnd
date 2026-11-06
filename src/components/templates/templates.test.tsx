import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppTemplate } from './app-template'
import { AuthTemplate } from './auth-template'
import { PublicTemplate } from './public-template'

describe('templates', () => {
  it('PublicTemplate usa o tema escuro e oferece Entrar e Criar conta', () => {
    const { container } = render(<PublicTemplate>conteúdo</PublicTemplate>)

    expect(container.firstChild).toHaveClass('dark')
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('AuthTemplate usa o tema escuro e mostra o rodapé quando informado', () => {
    render(<AuthTemplate rodape="Não tem conta?">formulário</AuthTemplate>)

    expect(screen.getByRole('main')).toHaveClass('dark')
    expect(screen.getByText('formulário')).toBeInTheDocument()
    expect(screen.getByText('Não tem conta?')).toBeInTheDocument()
  })

  it('AppTemplate usa o tema claro e mostra a navbar recebida', () => {
    const { container } = render(<AppTemplate navbar={<nav>menu</nav>}>painel</AppTemplate>)

    expect(container.firstChild).not.toHaveClass('dark')
    expect(screen.getByRole('link', { name: 'PoupaMais' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('menu')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('painel')
  })
})
