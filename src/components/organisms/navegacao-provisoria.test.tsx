import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GRUPOS_SIDEBAR, ITENS_BOTTOM_NAV } from '@/constants/navegacao'
import { BottomNavProvisoria, SidebarProvisoria, TopBarProvisoria } from './navegacao-provisoria'

describe('navegação provisória', () => {
  it('sidebar: marca o item ativo, alterna e avisa ao navegar', async () => {
    const onAlternar = vi.fn()
    const onNavegar = vi.fn()
    render(
      <SidebarProvisoria
        grupos={GRUPOS_SIDEBAR}
        ativo="/dashboard"
        expandida
        onAlternar={onAlternar}
        onNavegar={onNavegar}
      />,
    )

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Lançamentos' })).not.toHaveAttribute('aria-current')

    const alternar = screen.getByRole('button', { name: 'Recolher menu' })
    expect(alternar).toHaveAttribute('aria-expanded', 'true')
    expect(alternar).toHaveAttribute('aria-controls', 'sidebar')
    await userEvent.click(alternar)
    expect(onAlternar).toHaveBeenCalledOnce()

    const perfil = screen.getByRole('link', { name: 'Perfil' })
    perfil.addEventListener('click', (evento) => evento.preventDefault())
    await userEvent.click(perfil)
    expect(onNavegar).toHaveBeenCalledOnce()
  })

  it('sidebar recolhida oferece "Expandir menu"', () => {
    render(<SidebarProvisoria grupos={GRUPOS_SIDEBAR} expandida={false} onAlternar={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('barra inferior: 4 abas com o + no meio', () => {
    render(<BottomNavProvisoria itens={ITENS_BOTTOM_NAV} ativo="/lancamentos" hrefCriar="/lancamentos/novo" />)

    const nomes = screen.getAllByRole('link').map((link) => link.getAttribute('aria-label') ?? link.textContent)
    expect(nomes).toEqual(['Início', 'Lançamentos', 'Novo lançamento', 'Categorias', 'Perfil'])
    expect(screen.getByRole('link', { name: 'Lançamentos' })).toHaveAttribute('aria-current', 'page')
  })

  it('topo do celular mostra o título', () => {
    render(<TopBarProvisoria titulo="Início" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument()
  })
})
