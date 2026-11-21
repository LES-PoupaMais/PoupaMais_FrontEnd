import { act, fireEvent, render, screen } from '@testing-library/react'
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

  it('arrastar para baixo pela alça fecha; arrasto curto volta ao lugar', async () => {
    render(<ComGatilho />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
    const folha = screen.getByRole('dialog', { name: 'Criar' })
    const alca = folha.querySelector<HTMLElement>('[data-slot="create-sheet-alca"]')!

    fireEvent.pointerDown(alca, { pointerId: 1, button: 0, clientY: 500 })
    fireEvent.pointerMove(alca, { pointerId: 1, clientY: 508 })
    expect(folha.style.transform).toBe('translateY(8px)')
    fireEvent.pointerUp(alca, { pointerId: 1, clientY: 508 })
    expect(folha.style.transform).toBe('')
    expect(screen.getByRole('dialog', { name: 'Criar' })).toBeInTheDocument()

    fireEvent.pointerDown(alca, { pointerId: 2, button: 0, clientY: 500 })
    fireEvent.pointerMove(alca, { pointerId: 2, clientY: 560 })
    fireEvent.pointerMove(alca, { pointerId: 2, clientY: 620 })
    fireEvent.pointerUp(alca, { pointerId: 2, clientY: 620 })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('arrastar para cima ou cancelar o gesto não fecha; apertar no × não começa arrasto', async () => {
    render(<ComGatilho />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
    const folha = screen.getByRole('dialog', { name: 'Criar' })
    const alca = folha.querySelector<HTMLElement>('[data-slot="create-sheet-alca"]')!

    fireEvent.pointerDown(alca, { pointerId: 1, button: 0, clientY: 500 })
    fireEvent.pointerMove(alca, { pointerId: 1, clientY: 300 })
    fireEvent.pointerUp(alca, { pointerId: 1, clientY: 300 })
    fireEvent.pointerDown(alca, { pointerId: 2, button: 0, clientY: 500 })
    fireEvent.pointerMove(alca, { pointerId: 2, clientY: 700 })
    fireEvent.pointerCancel(alca, { pointerId: 2 })
    expect(folha.style.transform).toBe('')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fechar' }), { pointerId: 3, button: 0, clientY: 500 })
    fireEvent.pointerMove(alca, { pointerId: 3, clientY: 700 })
    fireEvent.pointerUp(alca, { pointerId: 3, clientY: 700 })
    expect(screen.getByRole('dialog', { name: 'Criar' })).toBeInTheDocument()
  })

  it('com prefers-reduced-motion a folha não acompanha o dedo, mas o gesto longo fecha', async () => {
    const original = window.matchMedia
    window.matchMedia = ((consulta: string) => ({
      ...original(consulta),
      matches: consulta.includes('prefers-reduced-motion'),
    })) as typeof window.matchMedia
    try {
      render(<ComGatilho />)
      await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
      const folha = screen.getByRole('dialog', { name: 'Criar' })
      const alca = folha.querySelector<HTMLElement>('[data-slot="create-sheet-alca"]')!

      fireEvent.pointerDown(alca, { pointerId: 1, button: 0, clientY: 500 })
      fireEvent.pointerMove(alca, { pointerId: 1, clientY: 600 })
      expect(folha.style.transform).toBe('')
      fireEvent.pointerUp(alca, { pointerId: 1, clientY: 600 })
      expect(screen.queryByRole('dialog')).toBeNull()
    } finally {
      window.matchMedia = original
    }
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
