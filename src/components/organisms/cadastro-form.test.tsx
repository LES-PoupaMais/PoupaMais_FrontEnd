import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CadastroForm } from './cadastro-form'

// O checkbox do Radix dentro de <form> mede a caixa com ResizeObserver, que o jsdom não tem
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const renderizar = (props: Partial<Parameters<typeof CadastroForm>[0]> = {}) => {
  const onSubmit = vi.fn()
  const resultado = render(<CadastroForm onSubmit={onSubmit} hrefPrivacidade="/privacidade" {...props} />)
  return { onSubmit, ...resultado }
}

async function preencher() {
  await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
  await userEvent.type(screen.getByLabelText('E-mail'), 'ana@x.com')
  await userEvent.type(screen.getByLabelText('Senha'), '123456')
  await userEvent.type(screen.getByLabelText('Confirmar senha'), '123456')
}

describe('CadastroForm', () => {
  it('mostra os erros de cada campo e o resumo no topo', async () => {
    const { onSubmit } = renderizar()

    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@x')
    await userEvent.type(screen.getByLabelText('Senha'), 'abc12')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Confira os 4 campos destacados abaixo.')).toBeInTheDocument()
    expect(screen.getByText('Informe um e-mail válido, como voce@email.com.')).toBeInTheDocument()
    expect(screen.getByText('A senha deve ter pelo menos 6 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument()
    expect(screen.getByText('Para criar a conta, aceite a Política de Privacidade.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('com um só erro, o resumo fala de um campo', async () => {
    renderizar()
    await preencher()

    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Confira o campo destacado abaixo.')).toBeInTheDocument()
  })

  it('envia com o aceite da Política (link em nova aba)', async () => {
    const { onSubmit } = renderizar()
    await preencher()

    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('target', '_blank')
    await userEvent.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(onSubmit).toHaveBeenCalledWith({
      nome: 'Ana Souza',
      email: 'ana@x.com',
      senha: '123456',
      confirmarSenha: '123456',
      aceiteTermos: true,
    })
  })

  it('mostra os erros da API no campo (409) e o aviso geral', async () => {
    renderizar({ errosDaApi: { email: 'Já existe uma conta com esse e-mail.', outro: 'x' }, erro: 'Falhou.' })

    expect(await screen.findByText('Já existe uma conta com esse e-mail.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou.')
  })

  it('ocupado e sem conexão', () => {
    const { rerender } = renderizar({ enviando: true })
    expect(screen.getByRole('button', { name: 'Criar conta' })).toHaveAttribute('aria-busy', 'true')

    rerender(<CadastroForm onSubmit={vi.fn()} hrefPrivacidade="/privacidade" semConexao />)
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeDisabled()
  })
})
