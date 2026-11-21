import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Stepper } from './stepper'

const PASSOS = ['Arquivo', 'Conferir', 'Pronto']

describe('Stepper', () => {
  it('mostra o contador e marca o passo atual e os feitos', () => {
    render(<Stepper passos={PASSOS} atual={1} />)

    expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Progresso' })
    const itens = within(nav).getAllByRole('listitem')
    expect(itens[0]).toHaveTextContent('Arquivo (concluído)')
    expect(itens[1]).toHaveAttribute('aria-current', 'step')
    expect(itens[2]).not.toHaveAttribute('aria-current')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('rodapé com Voltar e a ação final', async () => {
    const aoVoltar = vi.fn()
    const aoContinuar = vi.fn()
    render(
      <Stepper passos={PASSOS} atual={1} onVoltar={aoVoltar} onContinuar={aoContinuar} rotuloContinuar="Importar" />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }))
    expect(aoVoltar).toHaveBeenCalledOnce()
    expect(aoContinuar).toHaveBeenCalledOnce()
  })

  it('no primeiro passo o Voltar fica desabilitado; continuar pode carregar', () => {
    render(<Stepper passos={PASSOS} atual={0} onVoltar={() => {}} onContinuar={() => {}} continuarCarregando />)

    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveAttribute('aria-busy', 'true')
  })

  it('só com Continuar, e índice fora da faixa vira o último passo', () => {
    render(<Stepper passos={PASSOS} atual={9} onContinuar={() => {}} continuarDesabilitado />)

    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })
})
