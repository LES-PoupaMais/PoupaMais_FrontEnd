import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog'

function abrir(props: Partial<ConfirmDialogProps> = {}) {
  const onCancelar = vi.fn()
  const onConfirmar = vi.fn()
  render(
    <ConfirmDialog
      aberto
      onCancelar={onCancelar}
      onConfirmar={onConfirmar}
      titulo="Descartar alterações?"
      texto="Você mudou este lançamento e ainda não salvou. Se sair agora, as mudanças se perdem."
      rotuloConfirmar="Descartar"
      {...props}
    />,
  )
  return { onCancelar, onConfirmar }
}

describe('ConfirmDialog', () => {
  it('é um alertdialog com título, consequência e foco inicial em Cancelar', () => {
    abrir()
    const dialogo = screen.getByRole('alertdialog', { name: 'Descartar alterações?' })
    expect(dialogo).toHaveAccessibleDescription(/as mudanças se perdem/)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('Cancelar e Esc chamam onCancelar; Descartar chama onConfirmar', async () => {
    const usuario = userEvent.setup()
    const { onCancelar, onConfirmar } = abrir()

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await usuario.keyboard('{Escape}')
    expect(onCancelar).toHaveBeenCalledTimes(2)

    await usuario.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('só libera quando o texto digitado confere', async () => {
    const usuario = userEvent.setup()
    abrir({ titulo: 'Excluir conta', rotuloConfirmar: 'Excluir conta', confirmacaoDigitada: 'EXCLUIR' })
    const excluir = screen.getByRole('button', { name: 'Excluir conta' })
    const campo = screen.getByLabelText('Para confirmar, digite EXCLUIR')

    expect(excluir).toBeDisabled()
    expect(campo).toHaveAccessibleDescription('O botão só libera quando o texto for igual a EXCLUIR.')
    await usuario.type(campo, 'excluir')
    expect(excluir).toBeDisabled()
    await usuario.clear(campo)
    await usuario.type(campo, 'EXCLUIR')
    expect(excluir).toBeEnabled()
  })

  it('carregando: confirmar com spinner, Cancelar desabilitado e Esc não fecha', async () => {
    const usuario = userEvent.setup()
    const { onCancelar } = abrir({ carregando: true, children: <p>Conteúdo extra</p> })

    expect(screen.getByText('Conteúdo extra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descartar' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    await usuario.keyboard('{Escape}')
    expect(onCancelar).not.toHaveBeenCalled()
  })

  it('confirmarDesabilitado bloqueia o botão; fechado não renderiza', () => {
    const { unmount } = render(
      <ConfirmDialog
        aberto
        onCancelar={vi.fn()}
        onConfirmar={vi.fn()}
        titulo="Excluir conta"
        texto="Não dá para desfazer."
        rotuloConfirmar="Excluir conta"
        confirmarDesabilitado
      />,
    )
    expect(screen.getByRole('button', { name: 'Excluir conta' })).toBeDisabled()
    unmount()
    render(
      <ConfirmDialog
        aberto={false}
        onCancelar={vi.fn()}
        onConfirmar={vi.fn()}
        titulo="X"
        texto="Y"
        rotuloConfirmar="Z"
      />,
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
