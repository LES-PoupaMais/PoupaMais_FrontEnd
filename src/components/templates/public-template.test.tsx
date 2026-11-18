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
})
