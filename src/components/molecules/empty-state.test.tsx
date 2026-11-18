import { render, screen } from '@testing-library/react'
import { Plus, Trash2 } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('primeiro uso: título como heading, texto e ações em coluna', () => {
    render(
      <EmptyState
        icone={Plus}
        funcao="primaria"
        superficie="grande"
        titulo="Comece pelo seu primeiro lançamento"
        texto="Registre uma receita ou despesa."
        acoesEmColuna
        acoes={
          <>
            <a href="/lancamentos/novo">Criar primeiro lançamento</a>
            <a href="/lancamentos/importar">Importar CSV</a>
          </>
        }
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Comece pelo seu primeiro lançamento' })).toBeInTheDocument()
    expect(screen.getByText('Registre uma receita ou despesa.')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('lixeira vazia: sem ação, com h3', () => {
    const { container } = render(
      <EmptyState icone={Trash2} titulo="A lixeira está vazia" nivel="h3" superficie="sem-cartao" />,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'A lixeira está vazia' })).toBeInTheDocument()
    expect(container.querySelector('[data-slot="empty-state-acoes"]')).toBeNull()
  })
})
