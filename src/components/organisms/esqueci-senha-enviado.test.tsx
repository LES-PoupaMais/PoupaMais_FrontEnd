import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EsqueciSenhaEnviado } from './esqueci-senha-enviado'

describe('EsqueciSenhaEnviado', () => {
  it('não diz se a conta existe e oferece voltar ao login ou enviar de novo', async () => {
    const onEnviarDeNovo = vi.fn()
    render(<EsqueciSenhaEnviado hrefLogin="/login" onEnviarDeNovo={onEnviarDeNovo} />)

    expect(screen.getByRole('status')).toHaveTextContent('Se houver uma conta com esse e-mail')
    expect(screen.getByText('O link vale por 30 minutos e funciona uma vez só.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toHaveAttribute('href', '/login')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar de novo' }))
    expect(onEnviarDeNovo).toHaveBeenCalled()
  })
})
