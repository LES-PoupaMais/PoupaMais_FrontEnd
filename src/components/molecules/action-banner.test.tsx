import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionBanner } from './action-banner'

describe('ActionBanner', () => {
  it('informação: status, ação e fechar', async () => {
    const continuar = vi.fn()
    const onFechar = vi.fn()
    render(
      <ActionBanner
        texto="Seu rascunho foi guardado."
        acoes={[{ rotulo: 'Continuar', onClick: continuar }]}
        onFechar={onFechar}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Seu rascunho foi guardado.')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))
    expect(continuar).toHaveBeenCalledTimes(1)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('atenção com duas ações', async () => {
    const entrar = vi.fn()
    const agoraNao = vi.fn()
    render(
      <ActionBanner
        variante="atencao"
        texto="Sua sessão venceu. O que você preencheu foi guardado."
        acoes={[
          { rotulo: 'Entrar de novo', onClick: entrar },
          { rotulo: 'Agora não', onClick: agoraNao },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Agora não' }))
    expect(agoraNao).toHaveBeenCalled()
    expect(entrar).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Fechar aviso' })).not.toBeInTheDocument()
  })

  it('erro usa role="alert"; sucesso usa status', () => {
    const { rerender } = render(<ActionBanner variante="erro" texto="Não foi possível carregar as categorias." />)
    expect(screen.getByRole('alert')).toHaveAttribute('data-variante', 'erro')
    rerender(<ActionBanner variante="sucesso" texto="Tudo certo." />)
    expect(screen.getByRole('status')).toHaveAttribute('data-variante', 'sucesso')
  })
})
