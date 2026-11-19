import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AlterarSenhaForm, type ControleAlterarSenha } from './alterar-senha-form'

async function preencher(atual: string, nova: string, confirmar: string) {
  await userEvent.type(screen.getByLabelText('Senha atual'), atual)
  await userEvent.type(screen.getByLabelText('Nova senha'), nova)
  await userEvent.type(screen.getByLabelText('Confirmar nova senha'), confirmar)
}

describe('AlterarSenhaForm', () => {
  it('ao sair da confirmação diferente, avisa que as senhas não são iguais', async () => {
    render(<AlterarSenhaForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Nova senha')).toHaveAccessibleDescription(
      'Mínimo de 6 caracteres e diferente da atual.',
    )

    await preencher('poupa2025', 'poupa2026', 'poupa2062')
    await userEvent.tab()
    expect(await screen.findByText('As senhas não são iguais.')).toBeInTheDocument()
  })

  it('envia os dados e devolve o controle para mostrar o erro da API e limpar', async () => {
    let controle: ControleAlterarSenha | undefined
    const onSubmit = vi.fn((_dados, c: ControleAlterarSenha) => {
      controle = c
    })
    render(<AlterarSenhaForm onSubmit={onSubmit} />)
    await preencher('poupa2024', 'poupa2026', 'poupa2026')
    await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))

    expect(onSubmit.mock.calls[0][0]).toEqual({
      senhaAtual: 'poupa2024',
      novaSenha: 'poupa2026',
      confirmarSenha: 'poupa2026',
    })
    act(() => controle?.definirErro('senhaAtual', 'A senha atual está incorreta.'))
    expect(await screen.findByText('A senha atual está incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveFocus()

    act(() => controle?.limpar())
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.queryByText('A senha atual está incorreta.')).not.toBeInTheDocument()
  })

  it('enviando e sem conexão', () => {
    const { rerender } = render(<AlterarSenhaForm onSubmit={vi.fn()} enviando />)
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toHaveAttribute('aria-busy', 'true')
    rerender(<AlterarSenhaForm onSubmit={vi.fn()} bloqueado idMotivo="m" />)
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled()
  })
})
