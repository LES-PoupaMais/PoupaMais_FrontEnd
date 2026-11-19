import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExcluirContaDialog } from './excluir-conta-dialog'

const props = { aberto: true, onCancelar: vi.fn(), onConfirmar: vi.fn(), onBaixarDados: vi.fn() }

describe('ExcluirContaDialog', () => {
  it('começa em Cancelar, avisa e oferece baixar os dados antes', async () => {
    const onBaixarDados = vi.fn()
    render(<ExcluirContaDialog {...props} onBaixarDados={onBaixarDados} />)
    const dialogo = screen.getByRole('alertdialog', { name: 'Excluir conta' })
    expect(dialogo).toHaveTextContent('Sua conta, seus lançamentos, suas categorias e sua foto serão apagados.')
    expect(dialogo).toHaveTextContent('Não dá para desfazer.')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: 'Baixar meus dados antes' }))
    expect(onBaixarDados).toHaveBeenCalled()
  })

  it('só libera com EXCLUIR digitado e a senha preenchida', async () => {
    const onConfirmar = vi.fn()
    render(<ExcluirContaDialog {...props} onConfirmar={onConfirmar} />)
    const excluir = screen.getByRole('button', { name: 'Excluir conta' })
    expect(excluir).toBeDisabled()
    expect(screen.getByText(/O botão só libera quando o texto for igual a EXCLUIR e a senha/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Para confirmar, digite EXCLUIR'), 'EXCLUIR')
    expect(excluir).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Sua senha'), 'poupa2026')
    expect(excluir).toBeEnabled()
    expect(screen.getByText('Tudo certo: o botão está liberado.')).toBeInTheDocument()

    await userEvent.click(excluir)
    expect(onConfirmar).toHaveBeenCalledWith({ senha: 'poupa2026' })
  })

  it('mostra o erro da senha e o carregando; cancelar fecha e limpa', async () => {
    const onCancelar = vi.fn()
    const { rerender } = render(<ExcluirContaDialog {...props} erroSenha="Senha incorreta." excluindo />)
    expect(screen.getByText('Senha incorreta.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir conta' })).toHaveAttribute('aria-busy', 'true')

    rerender(<ExcluirContaDialog {...props} onCancelar={onCancelar} />)
    await userEvent.type(screen.getByLabelText('Sua senha'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalled()
    expect(screen.getByLabelText('Sua senha')).toHaveValue('')
  })
})
