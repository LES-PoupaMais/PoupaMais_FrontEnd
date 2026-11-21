import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MultiSelect, type MultiSelectProps, type OpcaoMultiSelect } from './multi-select'

const CATEGORIAS: OpcaoMultiSelect<number>[] = [
  { value: 3, label: 'Mercado' },
  { value: 1, label: 'Casa' },
  { value: 4, label: 'Salário' },
  { value: 9, label: 'Academia', inativa: true },
]

function Controlado({ inicial = [], onChange, ...props }: Partial<MultiSelectProps<number>> & { inicial?: number[] }) {
  const [valor, setValor] = useState<number[]>(inicial)
  return (
    <MultiSelect
      label="Categorias"
      options={CATEGORIAS}
      value={valor}
      onChange={(v) => {
        setValor(v)
        onChange?.(v)
      }}
      {...props}
    />
  )
}

const abrir = () => userEvent.click(screen.getByRole('button', { name: 'Abrir lista de categorias' }))

describe('MultiSelect', () => {
  it('fechado e vazio mostra o placeholder', () => {
    render(<Controlado required />)

    expect(screen.getByRole('group', { name: 'Categorias' })).toHaveTextContent('Escolha uma ou mais')
    expect(screen.queryByRole('list', { name: 'Categorias escolhidas' })).not.toBeInTheDocument()
  })

  it('marca opções pelas caixas de seleção e mostra chips neutros removíveis', async () => {
    const aoMudar = vi.fn()
    render(<Controlado onChange={aoMudar} />)

    await abrir()
    const painel = screen.getByRole('dialog', { name: 'Categorias' })
    const nomes = within(painel)
      .getAllByRole('checkbox')
      .map((c) => c.closest('label')?.textContent)
    expect(nomes).toEqual(['Casa', 'Mercado', 'Salário', 'Academia'])

    await userEvent.click(within(painel).getByRole('checkbox', { name: 'Mercado' }))
    await userEvent.click(within(painel).getByText('Casa'))
    expect(aoMudar).toHaveBeenLastCalledWith([3, 1])

    await userEvent.keyboard('{Escape}')
    const chips = screen.getByRole('list', { name: 'Categorias escolhidas' })
    expect(within(chips).getAllByRole('listitem')).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Remover Mercado' }))
    expect(aoMudar).toHaveBeenLastCalledWith([1])
  })

  it('desmarca uma escolhida pelo painel', async () => {
    const aoMudar = vi.fn()
    render(<Controlado inicial={[3]} onChange={aoMudar} />)

    await abrir()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mercado' }))
    expect(aoMudar).toHaveBeenLastCalledWith([])
  })

  it('inativas ficam no fim, desabilitadas, com a explicação', async () => {
    render(<Controlado onEdit={() => {}} />)

    await abrir()
    const academia = screen.getByRole('checkbox', { name: 'Academia' })
    expect(academia).toBeDisabled()
    expect(academia).toHaveAccessibleDescription('Categoria inativa: reative pelo lápis para poder escolher.')
    expect(screen.getByRole('button', { name: 'Editar categoria Academia (inativa)' })).toBeInTheDocument()
  })

  it('sem o lápis (sem onEdit), não fala em "reative pelo lápis"', async () => {
    render(<Controlado />)

    await abrir()
    const academia = screen.getByRole('checkbox', { name: 'Academia' })
    expect(academia).toBeDisabled()
    expect(academia).not.toHaveAccessibleDescription()
    expect(screen.queryByText(/reative pelo lápis/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Editar categoria/ })).toBeNull()
  })

  it('o lápis chama onEdit sem marcar', async () => {
    const aoEditar = vi.fn()
    const aoMudar = vi.fn()
    render(<Controlado onEdit={aoEditar} onChange={aoMudar} />)

    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Editar categoria Casa' }))
    expect(aoEditar).toHaveBeenCalledWith(1)
    expect(aoMudar).not.toHaveBeenCalled()
  })

  it('busca sem acento e oferece criar com o texto', async () => {
    const aoCriar = vi.fn()
    render(<Controlado onCreate={aoCriar} />)

    await abrir()
    expect(screen.getByRole('button', { name: 'Criar nova categoria' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar categoria' }), 'salario')
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar categoria' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar categoria' }), 'Farmácia')
    expect(screen.getByText('Nenhuma categoria encontrada para "Farmácia".')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Criar "Farmácia"' }))

    expect(aoCriar).toHaveBeenCalledWith('Farmácia')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('criar sem busca manda texto vazio', async () => {
    const aoCriar = vi.fn()
    render(<Controlado onCreate={aoCriar} />)

    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Criar nova categoria' }))
    expect(aoCriar).toHaveBeenCalledWith('')
  })

  it('abre ao clicar na área do campo e mostra skeleton enquanto carrega', async () => {
    render(<Controlado carregando />)

    await userEvent.click(screen.getByText('Escolha uma ou mais'))
    expect(screen.getByLabelText('Carregando categorias')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Fechar lista de categorias' })).toBeInTheDocument()
  })

  it('lista vazia avisa que não há opções', async () => {
    render(<MultiSelect label="Pessoas" nomeDoItem="pessoa" options={[]} value={[]} onChange={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir lista de pessoas' }))
    expect(screen.getByText('Nenhuma pessoa encontrada.')).toBeInTheDocument()
  })

  it('mostra o erro e, desabilitado, não abre', async () => {
    render(<Controlado inicial={[1]} error="Escolha pelo menos uma categoria." disabled />)

    expect(screen.getByRole('group', { name: 'Categorias' })).toHaveAccessibleDescription(
      'Escolha pelo menos uma categoria.',
    )
    await userEvent.click(screen.getByText('Casa'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover Casa' })).toBeDisabled()
  })

  it('folha (celular): título, contador, busca, lápis e "Inativas"; marcar atualiza o contador', async () => {
    const aoEditar = vi.fn()
    render(<Controlado apresentacao="folha" inicial={[3]} onEdit={aoEditar} onCreate={vi.fn()} />)

    await abrir()
    const folha = screen.getByRole('dialog', { name: 'Categorias' })
    expect(folha).toHaveAttribute('data-slot', 'multi-select-folha')
    expect(folha).toHaveAccessibleDescription('1 escolhida · toque para marcar ou desmarcar')
    expect(within(folha).getByRole('searchbox', { name: 'Buscar categoria' })).toBeInTheDocument()
    expect(within(folha).getByRole('button', { name: 'Criar nova categoria' })).toBeInTheDocument()
    expect(within(folha).getByText('Inativas')).toBeInTheDocument()

    await userEvent.click(within(folha).getByRole('checkbox', { name: 'Casa' }))
    expect(folha).toHaveAccessibleDescription('2 escolhidas · toque para marcar ou desmarcar')

    await userEvent.click(within(folha).getByRole('button', { name: 'Editar categoria Mercado' }))
    expect(aoEditar).toHaveBeenCalledWith(3)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('folha: o × e o botão do campo fecham', async () => {
    render(<Controlado apresentacao="folha" />)

    await userEvent.click(screen.getByRole('group', { name: 'Categorias' }))
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Categorias' })).getByRole('button', { name: 'Fechar' }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Categorias' })).toHaveTextContent('Escolha uma ou mais')
  })
})
