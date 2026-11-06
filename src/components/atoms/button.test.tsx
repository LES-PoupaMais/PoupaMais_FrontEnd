import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, buttonVariants } from './button'

describe('Button', () => {
  it('dispara o clique', async () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar}>Salvar lançamento</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar lançamento' }))

    expect(aoClicar).toHaveBeenCalledOnce()
  })

  it('é do tipo "button" por padrão, para não enviar formulários sem querer', () => {
    render(<Button>Limpar</Button>)

    expect(screen.getByRole('button', { name: 'Limpar' })).toHaveAttribute('type', 'button')
  })

  it('aceita type="submit" quando é o botão do formulário', () => {
    render(<Button type="submit">Entrar</Button>)

    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute('type', 'submit')
  })

  it('fica desabilitado e ocupado enquanto carrega (evita envio duplicado, RNF006)', async () => {
    const aoClicar = vi.fn()
    render(
      <Button loading onClick={aoClicar}>
        Importar
      </Button>,
    )
    const botao = screen.getByRole('button', { name: 'Importar' })

    await userEvent.click(botao)

    expect(botao).toBeDisabled()
    expect(botao).toHaveAttribute('aria-busy', 'true')
    expect(aoClicar).not.toHaveBeenCalled()
  })

  it('respeita disabled sem estar carregando', () => {
    render(<Button disabled>Excluir</Button>)

    const botao = screen.getByRole('button', { name: 'Excluir' })
    expect(botao).toBeDisabled()
    expect(botao).not.toHaveAttribute('aria-busy')
  })

  it('com asChild, aplica o estilo no filho (ex.: link)', () => {
    render(
      <Button asChild variant="success">
        <a href="/cadastro">Criar conta</a>
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Criar conta' })
    expect(link).toHaveAttribute('href', '/cadastro')
    expect(link).toHaveAttribute('data-variant', 'success')
  })

  it('tem a variante success com as cores da marca', () => {
    expect(buttonVariants({ variant: 'success' })).toContain('bg-success')
  })
})
