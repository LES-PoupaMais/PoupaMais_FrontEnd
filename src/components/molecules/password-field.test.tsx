import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PasswordField } from './password-field'

describe('PasswordField', () => {
  it('começa oculta e o olho mostra e oculta só este campo', async () => {
    render(
      <>
        <PasswordField label="Senha" help="Mínimo de 6 caracteres." autoComplete="new-password" />
        <PasswordField label="Confirmar senha" autoComplete="new-password" />
      </>,
    )
    const senha = screen.getByLabelText('Senha')
    const [olho, outroOlho] = screen.getAllByRole('button', { name: 'Mostrar senha' })

    expect(senha).toHaveAttribute('type', 'password')
    expect(senha).toHaveAttribute('autocomplete', 'new-password')
    expect(senha).toHaveAccessibleDescription('Mínimo de 6 caracteres.')
    expect(olho).toHaveAttribute('aria-pressed', 'false')
    expect(olho).toHaveAttribute('aria-controls', senha.id)

    await userEvent.click(olho)
    expect(senha).toHaveAttribute('type', 'text')
    expect(olho).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Confirmar senha')).toHaveAttribute('type', 'password')
    expect(outroOlho).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(olho)
    expect(senha).toHaveAttribute('type', 'password')
  })

  it('volta a ocultar ao enviar o formulário e repassa o ref', async () => {
    const ref = vi.fn()
    render(
      <form onSubmit={(e) => e.preventDefault()}>
        <PasswordField label="Senha" ref={ref} />
        <button type="submit">Entrar</button>
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(ref).toHaveBeenCalledWith(screen.getByLabelText('Senha'))
  })

  it('mostra o erro e desabilita o olho junto com o campo', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<PasswordField label="Senha atual" error="A senha atual está incorreta." disabled ref={ref} />)

    const campo = screen.getByLabelText('Senha atual')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('A senha atual está incorreta.')
    expect(campo).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeDisabled()
    expect(ref.current).toBe(campo)
  })
})
