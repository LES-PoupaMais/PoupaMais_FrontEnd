import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'

const renderizar = (props: Partial<Parameters<typeof LoginForm>[0]> = {}) => {
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} hrefEsqueci="/esqueci-senha" {...props} />)
  return { onSubmit }
}

describe('LoginForm', () => {
  it('usa POST, para a senha nunca ir para a URL se o JavaScript não carregar', () => {
    renderizar()
    expect(screen.getByRole('form', { name: 'Entrar' })).toHaveAttribute('method', 'post')
  })

  it('valida os campos antes de enviar', async () => {
    const { onSubmit } = renderizar()

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia e-mail e senha', async () => {
    const { onSubmit } = renderizar({ emailInicial: 'ana@x.com' })

    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(onSubmit).toHaveBeenCalledWith({ email: 'ana@x.com', senha: 'segredo' }, expect.anything())
  })

  it('mostra o erro como alerta, o link de esqueci e o botão ocupado', () => {
    renderizar({ erro: 'E-mail ou senha incorretos.', enviando: true })

    expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/esqueci-senha')
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute('aria-busy', 'true')
  })

  it('sem conexão, desabilita Entrar e explica o motivo', () => {
    renderizar({ semConexao: true })

    const botao = screen.getByRole('button', { name: 'Entrar' })
    expect(botao).toBeDisabled()
    expect(botao).toHaveAccessibleDescription(/Sem internet/)
  })
})
