import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { EmailField } from './email-field'

describe('EmailField', () => {
  it('tem rótulo visível, tipo e-mail e placeholder de exemplo', async () => {
    render(<EmailField name="email" />)

    const campo = screen.getByLabelText('E-mail')
    expect(campo).toHaveAttribute('type', 'email')
    expect(campo).toHaveAttribute('autocomplete', 'email')
    expect(campo).toHaveAttribute('placeholder', 'voce@email.com')
    await userEvent.type(campo, 'ana@x.com')
    expect(campo).toHaveValue('ana@x.com')
  })

  it('liga o erro ao campo', () => {
    render(<EmailField error="Informe o e-mail." />)

    const campo = screen.getByLabelText('E-mail')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Informe o e-mail.')
  })
})
