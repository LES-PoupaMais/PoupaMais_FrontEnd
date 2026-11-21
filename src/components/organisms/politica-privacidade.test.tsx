import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PoliticaPrivacidade } from './politica-privacidade'

describe('PoliticaPrivacidade', () => {
  it('tem o título, o índice com âncoras e cada seção', () => {
    render(<PoliticaPrivacidade hrefInicio="/" hrefLogin="/login" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeInTheDocument()
    const indice = screen.getByRole('navigation', { name: 'Nesta página' })
    expect(indice).toHaveTextContent('Seus direitos (LGPD)')
    expect(screen.getByRole('link', { name: 'Quais dados coletamos' })).toHaveAttribute('href', '#dados')
    expect(screen.getByRole('region', { name: 'Seus direitos (LGPD)' })).toHaveAttribute('id', 'direitos')
    const contato = screen.getByRole('region', { name: 'Contato' })
    expect(contato).toHaveTextContent(/encarregado pelo tratamento de dados/)
    expect(within(contato).getByRole('link', { name: 'poupamaisods18@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:poupamaisods18@gmail.com',
    )
    expect(screen.getAllByRole('link', { name: 'Voltar para o início' })[0]).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Entre' })).toHaveAttribute('href', '/login')
  })
})
