import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RedefinirSenhaForm } from './redefinir-senha-form'

describe('RedefinirSenhaForm', () => {
  it('exige senha de 6 caracteres e confirmação igual', async () => {
    const onSubmit = vi.fn()
    render(<RedefinirSenhaForm onSubmit={onSubmit} />)

    expect(screen.getByText('Mínimo de 6 caracteres.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nova senha'), '123')
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), '1234')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByText('A senha deve ter pelo menos 6 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia a nova senha e avisa que as outras sessões serão encerradas', async () => {
    const onSubmit = vi.fn()
    render(<RedefinirSenhaForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Nova senha'), '123456')
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(onSubmit).toHaveBeenCalledWith({ novaSenha: '123456', confirmarSenha: '123456' })
    expect(screen.getByText('Ao salvar, as outras sessões abertas são encerradas.')).toBeInTheDocument()
  })

  it('erro geral, ocupado e sem conexão', () => {
    const { rerender } = render(<RedefinirSenhaForm onSubmit={vi.fn()} erro="Falhou." enviando />)
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou.')
    expect(screen.getByRole('button', { name: 'Salvar nova senha' })).toHaveAttribute('aria-busy', 'true')

    rerender(<RedefinirSenhaForm onSubmit={vi.fn()} semConexao />)
    expect(screen.getByRole('button', { name: 'Salvar nova senha' })).toBeDisabled()
  })
})
