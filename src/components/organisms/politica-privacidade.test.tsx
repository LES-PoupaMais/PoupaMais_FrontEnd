import { render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('region', { name: 'Contato' })).toHaveTextContent(/ainda está sendo definido/)
    expect(screen.getAllByRole('link', { name: 'Voltar para o início' })[0]).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Entre' })).toHaveAttribute('href', '/login')
  })
})
