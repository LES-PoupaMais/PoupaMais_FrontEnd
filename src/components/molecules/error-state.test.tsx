import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './error-state'

describe('ErrorState', () => {
  it('erro ao carregar: alerta, texto que tranquiliza e Tentar de novo', async () => {
    const onTentarDeNovo = vi.fn()
    render(<ErrorState titulo="Não foi possível carregar o dashboard" onTentarDeNovo={onTentarDeNovo} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Seus dados continuam guardados')
    expect(screen.getByRole('heading', { level: 2, name: 'Não foi possível carregar o dashboard' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(onTentarDeNovo).toHaveBeenCalledTimes(1)
  })

  it('tentando de novo: botão ocupado, "Tentando…" e sem novo envio (mantém o foco: aria-disabled, não disabled)', async () => {
    const onTentarDeNovo = vi.fn()
    render(<ErrorState onTentarDeNovo={onTentarDeNovo} tentando />)
    const botao = screen.getByRole('button', { name: 'Tentando…' })
    expect(botao).toHaveAttribute('aria-disabled', 'true')
    expect(botao).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(botao)
    expect(onTentarDeNovo).not.toHaveBeenCalled()
  })

  it('404: título como h1, sem alerta e com Voltar ao início', () => {
    render(<ErrorState tipo="nao-encontrado" href="/dashboard" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/dashboard')
  })
})
