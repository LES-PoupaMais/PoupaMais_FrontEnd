import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/atoms/tooltip'
import type { Categoria } from '@/types/api'
import { LancamentoForm, valoresVazios, type LancamentoFormProps } from './lancamento-form'

// O Radix (switch e tooltip) mede os elementos com ResizeObserver, que o jsdom não tem
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const categorias: Categoria[] = [
  { id: 1, descricao: 'Aluguel', ativa: true },
  { id: 2, descricao: 'Mercado', ativa: true },
  { id: 4, descricao: 'Academia', ativa: false },
]

function renderizar(props: Partial<LancamentoFormProps> = {}) {
  const onSubmit = vi.fn()
  const usuario = userEvent.setup()
  const resultado = render(
    <TooltipProvider>
      <LancamentoForm
        id="form"
        valoresIniciais={valoresVazios('2026-11-18')}
        hoje="2026-11-18"
        categorias={categorias}
        onSubmit={onSubmit}
        {...props}
      />
      <button type="submit" form="form">
        Salvar lançamento
      </button>
    </TooltipProvider>,
  )
  return { ...resultado, onSubmit, usuario }
}

describe('LancamentoForm', () => {
  it('começa com a data de hoje, sem tipo e com "Conta no saldo" ligado', () => {
    renderizar()

    expect(screen.getByLabelText(/^Data/)).toHaveValue('18/11/2026')
    expect(screen.getByRole('radio', { name: 'Receita' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'Despesa' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('switch', { name: 'Conta no saldo' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Entra no saldo e no dashboard.')).toBeInTheDocument()
    expect(screen.getByText('0/100')).toBeInTheDocument()
  })

  it('vazio: mostra o resumo e o erro de cada campo, sem enviar', async () => {
    const { usuario, onSubmit } = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Salvar lançamento' }))

    expect(await screen.findByText('Faltam 4 informações. Confira os campos marcados.')).toBeInTheDocument()
    expect(screen.getByText('Informe a descrição.')).toBeInTheDocument()
    expect(screen.getByText('Escolha Receita ou Despesa.')).toBeInTheDocument()
    expect(screen.getByText('Informe o valor.')).toBeInTheDocument()
    expect(screen.getByText('Escolha pelo menos uma categoria.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('data que não existe mostra a mensagem do campo de data', async () => {
    const { usuario } = renderizar({
      valoresIniciais: {
        ...valoresVazios('2026-11-18'),
        descricao: 'x',
        tipo: 'DESPESA',
        valor: 10,
        categoriaIds: [1],
      },
    })
    const data = screen.getByLabelText(/^Data/)
    await usuario.clear(data)
    await usuario.type(data, '31/02/2026')
    await usuario.click(screen.getByRole('button', { name: 'Salvar lançamento' }))

    expect(await screen.findByText('Falta 1 informação. Confira o campo marcado.')).toBeInTheDocument()
    expect(screen.getByText('Informe uma data válida, no formato dd/mm/aaaa.')).toBeInTheDocument()
  })

  it('preenchido: envia o corpo da API e "Conta no saldo"', async () => {
    const { usuario, onSubmit } = renderizar()

    await usuario.type(screen.getByLabelText(/^Descrição/), '  Mercado do mês ')
    await usuario.click(screen.getByRole('radio', { name: 'Despesa' }))
    const data = screen.getByLabelText(/^Data/)
    await usuario.clear(data)
    await usuario.type(data, '05/11/2026')
    await usuario.type(screen.getByLabelText(/^Valor/), '1.120,35')
    expect(screen.getByText(/Despesa: vai aparecer como/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Abrir lista de categorias' }))
    await usuario.click(await screen.findByRole('checkbox', { name: 'Mercado' }))
    expect(screen.getByRole('checkbox', { name: 'Academia' })).toBeDisabled()
    await usuario.keyboard('{Escape}')
    await usuario.click(screen.getByRole('switch', { name: 'Conta no saldo' }))
    expect(screen.getByText('Fica na lista, mas fora do saldo e do dashboard.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Salvar lançamento' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          descricao: 'Mercado do mês',
          tipo: 'DESPESA',
          data: '2026-11-05',
          valor: 1120.35,
          categoriaIds: [2],
          contaNoSaldo: false,
        },
        expect.anything(),
      ),
    )
  })

  it('avisa quando fica com alterações não salvas', async () => {
    const onSujoChange = vi.fn()
    const { usuario } = renderizar({ onSujoChange })

    expect(onSujoChange).toHaveBeenLastCalledWith(false)
    await usuario.type(screen.getByLabelText(/^Descrição/), 'a')
    expect(onSujoChange).toHaveBeenLastCalledWith(true)
  })

  it('"+ Criar nova categoria" passa o texto da busca e a criada entra escolhida', async () => {
    const onCriarCategoria = vi.fn()
    const { usuario, rerender } = renderizar({ onCriarCategoria })

    await usuario.click(screen.getByRole('button', { name: 'Abrir lista de categorias' }))
    await usuario.type(await screen.findByRole('searchbox', { name: 'Buscar categoria' }), 'Farmácia')
    await usuario.click(screen.getByRole('button', { name: 'Criar "Farmácia"' }))
    expect(onCriarCategoria).toHaveBeenCalledWith('Farmácia', expect.any(Function))

    const selecionar = onCriarCategoria.mock.calls[0][1] as (id: number) => void
    rerender(
      <TooltipProvider>
        <LancamentoForm
          id="form"
          valoresIniciais={valoresVazios('2026-11-18')}
          hoje="2026-11-18"
          categorias={[...categorias, { id: 9, descricao: 'Farmácia', ativa: true }]}
          onSubmit={vi.fn()}
          onCriarCategoria={onCriarCategoria}
        />
      </TooltipProvider>,
    )
    selecionar(9)
    expect(await screen.findByRole('button', { name: 'Remover Farmácia' })).toBeInTheDocument()
  })

  it('erros da API vão para os campos', async () => {
    renderizar({
      errosDoServidor: [
        { campo: 'data', mensagem: 'Data fora do permitido.' },
        { campo: 'x', mensagem: 'y' },
      ],
    })

    expect(await screen.findByText('Data fora do permitido.')).toBeInTheDocument()
    expect(screen.queryByText('y')).toBeNull()
  })

  it('enviando: campos desabilitados', () => {
    renderizar({ enviando: true, rodape: <p>rodapé</p> })

    expect(screen.getByLabelText(/^Descrição/)).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Receita' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: 'Conta no saldo' })).toBeDisabled()
    expect(screen.getByRole('form', { name: 'Dados do lançamento' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('rodapé')).toBeInTheDocument()
  })
})
