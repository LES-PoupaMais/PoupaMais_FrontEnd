import type React from 'react'
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

  it('fica ocupado e ignora cliques enquanto carrega, sem perder o foco (evita envio duplicado, RNF006)', async () => {
    const aoClicar = vi.fn()
    render(
      <Button loading onClick={aoClicar}>
        Importando…
      </Button>,
    )
    const botao = screen.getByRole('button', { name: 'Importando…' })

    await userEvent.click(botao)

    expect(botao).toHaveAttribute('aria-busy', 'true')
    expect(botao).toHaveAttribute('aria-disabled', 'true')
    expect(botao).toHaveFocus()
    expect(aoClicar).not.toHaveBeenCalled()
  })

  it('carregando dentro de um formulário, não envia de novo', async () => {
    const aoEnviar = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={aoEnviar}>
        <Button type="submit" loading>
          Salvando…
        </Button>
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Salvando…' }))

    expect(aoEnviar).not.toHaveBeenCalled()
  })

  it('respeita disabled sem estar carregando', () => {
    render(<Button disabled>Excluir</Button>)

    const botao = screen.getByRole('button', { name: 'Excluir' })
    expect(botao).toBeDisabled()
    expect(botao).not.toHaveAttribute('aria-busy')
  })

  it('com asChild, aplica o estilo no filho (ex.: link)', () => {
    render(
      <Button asChild variant="contornado">
        <a href="/cadastro">Criar conta</a>
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Criar conta' })
    expect(link).toHaveAttribute('href', '/cadastro')
    expect(link).toHaveAttribute('data-variant', 'contornado')
  })

  it('usa as variantes do Design System, com o primário como padrão', () => {
    render(<Button>Salvar lançamento</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primario')
    expect(buttonVariants()).toContain('bg-primary')
    expect(buttonVariants({ variant: 'perigo' })).toContain('bg-destructive')
    expect(buttonVariants({ variant: 'perigo-texto' })).toContain('text-destructive')
    expect(buttonVariants({ size: 'pequeno' })).toContain('h-9')
    expect(buttonVariants({ size: 'icone' })).toContain('size-11')
  })

  it('mantém os nomes do shadcn como apelidos das variantes do Design System', () => {
    expect(buttonVariants({ variant: 'outline' })).toBe(buttonVariants({ variant: 'contornado' }))
    expect(buttonVariants({ variant: 'ghost', size: 'xl' })).toBe(buttonVariants({ variant: 'texto', size: 'padrao' }))
    expect(buttonVariants({ size: 'icon-sm' })).toContain('size-9')
  })
})
