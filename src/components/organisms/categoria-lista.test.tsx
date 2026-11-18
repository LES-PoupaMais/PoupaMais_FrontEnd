import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CategoriaComContagem } from '@/types/api'
import { CategoriaLista } from './categoria-lista'

const categorias: CategoriaComContagem[] = [
  { id: 1, descricao: 'Aluguel', ativa: true, quantidadeLancamentos: 1 },
  { id: 2, descricao: 'Mercado', ativa: true, quantidadeLancamentos: 5 },
  { id: 4, descricao: 'Academia', ativa: false, quantidadeLancamentos: 0 },
]

// O jsdom não aplica CSS: os cards e a tabela aparecem juntos; cada teste olha um deles
const cartoes = (c: HTMLElement) => within(c.querySelector('[data-slot="categoria-lista-cartoes"]') as HTMLElement)
const tabela = (c: HTMLElement) => within(c.querySelector('[data-slot="categoria-lista-tabela"]') as HTMLElement)

function renderizar(extra: Partial<Parameters<typeof CategoriaLista>[0]> = {}) {
  const onEditar = vi.fn()
  const onReativar = vi.fn()
  const { container } = render(
    <CategoriaLista
      categorias={categorias}
      periodo="Nov/2026"
      onEditar={onEditar}
      onReativar={onReativar}
      {...extra}
    />,
  )
  return { container, onEditar, onReativar, usuario: userEvent.setup() }
}

describe('CategoriaLista', () => {
  it('nos cards: ativas com a contagem do mês e inativas com Reativar', async () => {
    const { container, onEditar, onReativar, usuario } = renderizar()
    const c = cartoes(container)

    expect(c.getByRole('heading', { name: 'Ativas · 2' })).toBeInTheDocument()
    expect(c.getByText('Lançamentos em Nov/2026')).toBeInTheDocument()
    expect(c.getByText('1 lançamento')).toBeInTheDocument()
    expect(c.getByText('5 lançamentos')).toBeInTheDocument()
    expect(c.getByRole('heading', { name: 'Inativas · 1' })).toBeInTheDocument()
    expect(c.getByText('Não aparece para escolher')).toBeInTheDocument()

    await usuario.click(c.getByRole('button', { name: 'Editar categoria Mercado' }))
    expect(onEditar).toHaveBeenCalledWith(categorias[1])
    await usuario.click(c.getByRole('button', { name: 'Reativar Academia' }))
    expect(onReativar).toHaveBeenCalledWith(categorias[2])
  })

  it('na tabela: contador, situação e a inativa também pode ser editada', async () => {
    const { container, onEditar, usuario } = renderizar()
    const t = tabela(container)

    expect(t.getByText('3 categorias')).toBeInTheDocument()
    expect(t.getByText('2 ativas · 1 inativa')).toBeInTheDocument()
    expect(t.getByRole('columnheader', { name: 'Lançamentos em Nov/2026' })).toBeInTheDocument()
    expect(t.getAllByText('Ativa')).toHaveLength(2)
    expect(t.getByRole('row', { name: /Academia/ })).toHaveTextContent('Inativa')

    await usuario.click(t.getByRole('button', { name: 'Editar categoria Academia' }))
    expect(onEditar).toHaveBeenCalledWith(categorias[2])
  })

  it('sem conexão, Reativar não chama a ação e aponta para o motivo', async () => {
    const { container, onReativar, usuario } = renderizar({ motivoBloqueioId: 'motivo' })
    const botao = cartoes(container).getByRole('button', { name: 'Reativar Academia' })

    await usuario.click(botao)
    expect(onReativar).not.toHaveBeenCalled()
    expect(botao).toHaveAttribute('aria-describedby', 'motivo')
  })

  it('só ativas: sem grupo de inativas; reativando mostra o spinner', () => {
    const { container } = renderizar({ categorias: [categorias[0]], reativandoId: 4 })
    expect(cartoes(container).queryByRole('heading', { name: /Inativas/ })).toBeNull()
    expect(tabela(container).getByText('1 categoria')).toBeInTheDocument()
    expect(tabela(container).getByText('1 ativa · 0 inativas')).toBeInTheDocument()
  })
})
