import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tag } from 'lucide-react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ITENS_CRIAR } from '@/constants/navegacao'
import { CreateSheet, TRAVA_AO_ABRIR_MS, type ItemCreateSheet } from './create-sheet'

function ComGatilho({ itens = ITENS_CRIAR }: { itens?: ItemCreateSheet[] }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAberto(true)}>
        Criar
      </button>
      <CreateSheet aberto={aberto} onAbertoChange={setAberto} itens={itens} />
    </>
  )
}

const semNavegar = (link: HTMLElement) => link.addEventListener('click', (evento) => evento.preventDefault())

describe('CreateSheet', () => {
  afterEach(() => vi.useRealTimers())

  it('fechada não mostra nada', () => {
    render(<CreateSheet aberto={false} onAbertoChange={vi.fn()} itens={ITENS_CRIAR} />)

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abre como diálogo "Criar" com os itens, foco no primeiro item', async () => {
    render(<ComGatilho />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))

    const folha = screen.getByRole('dialog', { name: 'Criar' })
    expect(folha).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Novo lançamento/ })).toHaveAttribute('href', '/lancamentos/novo')
    expect(screen.getByRole('link', { name: /Importar CSV/ })).toHaveAttribute('href', '/lancamentos/importar')
    expect(screen.getByRole('button', { name: /Nova categoria/ })).toBeInTheDocument()
    expect(screen.getByText('Registre uma receita ou despesa do mês.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Novo lançamento/ })).toHaveFocus()
  })

  it('Esc fecha e devolve o foco ao botão que abriu', async () => {
    render(<ComGatilho />)
    const gatilho = screen.getByRole('button', { name: 'Criar' })
    await userEvent.click(gatilho)

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(gatilho).toHaveFocus()
  })

  it('o × fecha', async () => {
    render(<ComGatilho />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('escolher um item fecha a folha (link ou ação)', async () => {
    const onSelect = vi.fn()
    render(
      <ComGatilho itens={[...ITENS_CRIAR, { icone: Tag, titulo: 'Ação', subtitulo: 'Faz algo aqui.', onSelect }]} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
    await act(() => new Promise((fim) => setTimeout(fim, TRAVA_AO_ABRIR_MS + 20)))
    const novo = screen.getByRole('link', { name: /Novo lançamento/ })
    semNavegar(novo)
    await userEvent.click(novo)
    expect(screen.queryByRole('dialog')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
    await act(() => new Promise((fim) => setTimeout(fim, TRAVA_AO_ABRIR_MS + 20)))
    await userEvent.click(screen.getByRole('button', { name: /Ação/ }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fica travada nos primeiros 300 ms depois de abrir', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<ComGatilho />)
    await usuario.click(screen.getByRole('button', { name: 'Criar' }))

    const lista = screen.getByRole('list')
    expect(lista).toHaveAttribute('data-travada', 'true')
    act(() => vi.advanceTimersByTime(TRAVA_AO_ABRIR_MS))
    expect(lista).toHaveAttribute('data-travada', 'false')
  })
})
