import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppShellTemplate } from './app-shell-template'

const casca = (container: HTMLElement) => container.querySelector('[data-slot="app-shell"]') as HTMLElement
const parte = (container: HTMLElement, slot: string) => container.querySelector(`[data-slot="${slot}"]`)

describe('AppShellTemplate', () => {
  it('coloca cada slot no seu lugar e o conteúdo no <main>', () => {
    const { container } = render(
      <AppShellTemplate sidebar={<nav>lateral</nav>} bottomNav={<nav>inferior</nav>} header={<h1>Início</h1>}>
        painel
      </AppShellTemplate>,
    )

    expect(parte(container, 'app-shell-sidebar')).toHaveTextContent('lateral')
    expect(parte(container, 'app-shell-sidebar')).toHaveAttribute('id', 'sidebar')
    expect(parte(container, 'app-shell-bottom-nav')).toHaveTextContent('inferior')
    expect(parte(container, 'app-shell-header')).toHaveTextContent('Início')
    expect(screen.getByRole('main')).toHaveTextContent('painel')
    expect(screen.getByRole('main')).toHaveAttribute('data-com-bottom-nav', 'true')
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo')
  })

  it('expõe o estado da sidebar em data-* para o CSS e para a variante trilho:', () => {
    const { container } = render(
      <AppShellTemplate sidebar={<nav />} recolhida>
        painel
      </AppShellTemplate>,
    )

    expect(casca(container)).toHaveAttribute('data-sidebar-recolhida', 'true')
    expect(casca(container)).toHaveAttribute('data-sidebar-aberta', 'false')
    expect(parte(container, 'app-shell-area')).toHaveAttribute('data-com-sidebar', 'true')
    expect(parte(container, 'app-shell-veu')).toBeNull()
  })

  it('sem sidebar nem barra inferior vira a casca simples', () => {
    const { container } = render(<AppShellTemplate>painel</AppShellTemplate>)

    expect(parte(container, 'app-shell-sidebar')).toBeNull()
    expect(parte(container, 'app-shell-bottom-nav')).toBeNull()
    expect(parte(container, 'app-shell-area')).toHaveAttribute('data-com-sidebar', 'false')
    expect(screen.getByRole('main')).toHaveAttribute('data-com-bottom-nav', 'false')
  })

  it('aberta no tablet: o véu e o Esc fecham a sidebar', async () => {
    const onFecharSidebar = vi.fn()
    const { container } = render(
      <AppShellTemplate sidebar={<button type="button">Dashboard</button>} aberta onFecharSidebar={onFecharSidebar}>
        painel
      </AppShellTemplate>,
    )

    await userEvent.click(parte(container, 'app-shell-veu') as HTMLElement)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dashboard' }), { key: 'Escape' })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dashboard' }), { key: 'Enter' })

    expect(onFecharSidebar).toHaveBeenCalledTimes(2)
  })

  it('fechada, o Esc não faz nada', () => {
    const onFecharSidebar = vi.fn()
    render(
      <AppShellTemplate sidebar={<button type="button">Dashboard</button>} onFecharSidebar={onFecharSidebar}>
        painel
      </AppShellTemplate>,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Dashboard' }), { key: 'Escape' })

    expect(onFecharSidebar).not.toHaveBeenCalled()
  })
})
