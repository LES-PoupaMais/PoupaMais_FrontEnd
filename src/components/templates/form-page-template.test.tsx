import Link from 'next/link'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormPageTemplate } from './form-page-template'

describe('FormPageTemplate', () => {
  it('mostra título, descrição, voltar, aviso, campos e ações', () => {
    render(
      <FormPageTemplate
        titulo="Novo lançamento"
        descricao="Registre uma receita ou despesa."
        voltar={<Link href="/lancamentos">Voltar para Lançamentos</Link>}
        aviso={<p role="alert">Sem conexão</p>}
        acoes={<button type="submit">Salvar lançamento</button>}
      >
        <label>
          Descrição <input />
        </label>
      </FormPageTemplate>,
    )

    expect(screen.getByRole('region', { name: 'Novo lançamento' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Novo lançamento', hidden: true })).toBeInTheDocument()
    expect(screen.getByText('Registre uma receita ou despesa.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Lançamentos' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão')
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar lançamento' })).toBeInTheDocument()
  })

  it('sem ações, não reserva o rodapé fixo', () => {
    const { container } = render(<FormPageTemplate titulo="Editar lançamento">campos</FormPageTemplate>)

    expect(container.querySelector('[data-slot="form-page-acoes"]')).toBeNull()
    expect(screen.queryByText('Registre uma receita ou despesa.')).not.toBeInTheDocument()
  })
})
