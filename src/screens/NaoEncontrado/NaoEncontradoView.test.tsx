import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NaoEncontradoView } from './NaoEncontradoView'

const loja = { get: vi.fn() }
vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => loja }))

describe('404', () => {
  it('deslogado: volta para a página inicial', () => {
    render(<NaoEncontradoView logado={false} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'Ver lançamentos' })).not.toBeInTheDocument()
  })

  it('logado: volta ao Dashboard e oferece Ver lançamentos', () => {
    render(<NaoEncontradoView logado />)

    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Ver lançamentos' })).toHaveAttribute('href', '/lancamentos')
    expect(screen.getByText(/Seus dados continuam guardados/)).toBeInTheDocument()
  })

  it('o componente de servidor decide pelo cookie da sessão', async () => {
    const { NaoEncontrado } = await import('./NaoEncontrado')
    loja.get.mockReturnValue({ value: 'jwt' })

    render(await NaoEncontrado())

    expect(screen.getByRole('link', { name: 'Ver lançamentos' })).toBeInTheDocument()
  })
})
