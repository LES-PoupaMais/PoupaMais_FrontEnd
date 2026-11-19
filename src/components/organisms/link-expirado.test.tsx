import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LinkExpirado } from './link-expirado'

describe('LinkExpirado', () => {
  it('leva a pedir outro link ou ao login', () => {
    render(<LinkExpirado hrefPedirOutro="/esqueci-senha" hrefLogin="/login" />)

    expect(screen.getByRole('link', { name: 'Pedir outro link' })).toHaveAttribute('href', '/esqueci-senha')
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toHaveAttribute('href', '/login')
  })
})
