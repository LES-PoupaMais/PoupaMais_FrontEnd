import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErroGeralView } from './ErroGeralView'

describe('Erro geral', () => {
  it('área logada: alerta, Tentar de novo e Voltar ao Dashboard', async () => {
    const onTentarDeNovo = vi.fn()
    render(<ErroGeralView area="logada" onTentarDeNovo={onTentarDeNovo} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar esta página.')
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/dashboard')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(onTentarDeNovo).toHaveBeenCalled()
  })

  it('área pública: página inteira com o logo e volta para a página inicial', () => {
    render(<ErroGeralView area="publica" onTentarDeNovo={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'PoupaMais, ir para a página inicial' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
  })
})
