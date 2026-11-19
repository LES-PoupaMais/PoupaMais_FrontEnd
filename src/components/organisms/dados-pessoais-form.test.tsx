import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DadosPessoaisForm } from './dados-pessoais-form'

describe('DadosPessoaisForm', () => {
  it('mostra o nome e o e-mail só para leitura', () => {
    render(<DadosPessoaisForm nome="Leonardo" email="leonardo@exemplo.com" onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Dados' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Leonardo')
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('O e-mail não pode ser alterado.')
  })

  it('valida o nome e envia sem espaços nas pontas', async () => {
    const onSubmit = vi.fn()
    render(<DadosPessoaisForm nome="Leonardo" email="l@e.com" onSubmit={onSubmit} />)
    const campo = screen.getByLabelText('Nome')

    await userEvent.clear(campo)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nome' }))
    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await userEvent.type(campo, '  Leonardo Nascimento ')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nome' }))
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Leonardo Nascimento' })
  })

  it('mostra o erro da API no campo, o envio em andamento e o bloqueio sem conexão', () => {
    const { rerender } = render(
      <DadosPessoaisForm nome="L" email="l@e.com" onSubmit={vi.fn()} erroNome="Confira o nome." enviando />,
    )
    expect(screen.getByText('Confira o nome.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar nome' })).toHaveAttribute('aria-busy', 'true')

    rerender(<DadosPessoaisForm nome="L" email="l@e.com" onSubmit={vi.fn()} bloqueado idMotivo="m" />)
    expect(screen.getByRole('button', { name: 'Salvar nome' })).toBeDisabled()
  })
})
