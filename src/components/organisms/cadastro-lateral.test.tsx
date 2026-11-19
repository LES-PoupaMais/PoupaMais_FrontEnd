import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CadastroLateral } from './cadastro-lateral'

describe('CadastroLateral', () => {
  it('apresenta o que o PoupaMais faz em três itens', () => {
    render(<CadastroLateral />)

    expect(screen.getByRole('heading', { level: 2, name: /Comece a organizar o seu dinheiro/ })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Seus dados são seus')).toBeInTheDocument()
  })
})
