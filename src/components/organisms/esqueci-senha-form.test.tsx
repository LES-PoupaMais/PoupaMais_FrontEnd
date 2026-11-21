import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EsqueciSenhaForm } from './esqueci-senha-form'

describe('EsqueciSenhaForm', () => {
  it('valida e envia o e-mail', async () => {
    const onSubmit = vi.fn()
    render(<EsqueciSenhaForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@x.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(onSubmit).toHaveBeenCalledWith({ email: 'ana@x.com' })
  })

  it('erro geral, ocupado e sem conexão', () => {
    const { rerender } = render(<EsqueciSenhaForm onSubmit={vi.fn()} erro="Sem servidor." enviando />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sem servidor.')
    expect(screen.getByRole('button', { name: 'Enviar link' })).toHaveAttribute('aria-busy', 'true')

    rerender(<EsqueciSenhaForm onSubmit={vi.fn()} semConexao />)
    expect(screen.getByRole('button', { name: 'Enviar link' })).toBeDisabled()
  })
})
