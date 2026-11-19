import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionHeader } from './section-header'

describe('SectionHeader', () => {
  it('título como heading e "Ver todos" com contexto', () => {
    render(
      <SectionHeader
        titulo="Maiores despesas"
        idTitulo="maiores"
        acao={{ rotulo: 'Ver todos', href: '/lancamentos', 'aria-label': 'Ver todas as maiores despesas' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Maiores despesas' })).toHaveAttribute('id', 'maiores')
    expect(screen.getByRole('link', { name: 'Ver todas as maiores despesas' })).toHaveAttribute('href', '/lancamentos')
  })

  it('sem ação e com h3', () => {
    render(<SectionHeader titulo="Despesas por categoria" nivel="h3" />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Despesas por categoria')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
