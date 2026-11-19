import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GRUPOS_SIDEBAR } from '@/constants/navegacao'
import { Sidebar, type SidebarProps } from './sidebar'

function renderizar(props: Partial<SidebarProps> = {}) {
  const callbacks = { onAlternar: vi.fn(), onNavegar: vi.fn(), onSair: vi.fn() }
  const resultado = render(
    <Sidebar
      grupos={GRUPOS_SIDEBAR}
      ativo="/dashboard"
      expandida
      hrefInicio="/dashboard"
      hrefNovo="/lancamentos/novo"
      {...callbacks}
      {...props}
    />,
  )
  return { ...resultado, ...callbacks }
}

const semNavegar = (link: HTMLElement) => link.addEventListener('click', (evento) => evento.preventDefault())

// O tooltip do Radix mede o gatilho com ResizeObserver, que o jsdom não tem
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

describe('Sidebar', () => {
  it('mostra os grupos com títulos ligados às listas e marca o item ativo', () => {
    renderizar()

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const diaADia = within(nav).getByRole('list', { name: 'Dia a dia' })
    expect(
      within(diaADia)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Lançamentos', 'Categorias', 'Lixeira'])
    expect(within(diaADia).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(within(diaADia).getByRole('link', { name: 'Lançamentos' })).not.toHaveAttribute('aria-current')

    const conta = within(nav).getByRole('list', { name: 'Conta' })
    expect(within(conta).getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
    expect(within(conta).getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('tem o logo para o Dashboard e o "Novo lançamento" para o formulário', () => {
    renderizar()

    expect(screen.getByRole('link', { name: 'PoupaMais, ir para o Dashboard' })).toHaveAttribute('href', '/dashboard')
    for (const link of screen.getAllByRole('link', { name: 'Novo lançamento' })) {
      expect(link).toHaveAttribute('href', '/lancamentos/novo')
    }
  })

  it('o botão de alternar diz o que faz, controla a sidebar e avisa', async () => {
    const { onAlternar, rerender } = renderizar({ idSidebar: 'minha-sidebar' })

    const alternar = screen.getByRole('button', { name: 'Recolher menu' })
    expect(alternar).toHaveAttribute('aria-expanded', 'true')
    expect(alternar).toHaveAttribute('aria-controls', 'minha-sidebar')
    await userEvent.click(alternar)
    expect(onAlternar).toHaveBeenCalledOnce()

    rerender(
      <Sidebar
        grupos={GRUPOS_SIDEBAR}
        expandida={false}
        hrefInicio="/dashboard"
        hrefNovo="/lancamentos/novo"
        onAlternar={onAlternar}
        onSair={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('recolhida, mostra o nome num tooltip (só visual) ao passar sobre o ícone', async () => {
    renderizar({ expandida: false })

    await userEvent.hover(screen.getByRole('link', { name: 'Lixeira' }))
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent('Lixeira')
  })

  it('expandida, não mostra tooltip', async () => {
    renderizar()

    await userEvent.hover(screen.getByRole('link', { name: 'Lançamentos' }))
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
  })

  it('escolher um destino avisa (para fechar no tablet); Sair chama a ação', async () => {
    const { onNavegar, onSair } = renderizar()

    const categorias = screen.getByRole('link', { name: 'Categorias' })
    semNavegar(categorias)
    await userEvent.click(categorias)
    expect(onNavegar).toHaveBeenCalledOnce()

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(onSair).toHaveBeenCalledOnce()
  })

  it('saindo, o Sair fica desabilitado', () => {
    renderizar({ saindo: true })

    expect(screen.getByRole('button', { name: 'Sair' })).toBeDisabled()
  })

  it('aberta por cima (tablet), o Tab fica preso dentro da sidebar', async () => {
    renderizar({ prenderFoco: true })

    const primeiro = screen.getByRole('link', { name: 'PoupaMais, ir para o Dashboard' })
    const ultimo = screen.getByRole('button', { name: 'Sair' })

    ultimo.focus()
    await userEvent.tab()
    expect(primeiro).toHaveFocus()

    await userEvent.tab({ shift: true })
    expect(ultimo).toHaveFocus()

    // no meio da lista, o Tab segue normal
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveFocus()
  })

  it('sem prender o foco, o Tab sai da sidebar', async () => {
    render(
      <>
        <Sidebar
          grupos={GRUPOS_SIDEBAR}
          expandida
          hrefInicio="/dashboard"
          hrefNovo="/lancamentos/novo"
          onAlternar={vi.fn()}
          onSair={vi.fn()}
        />
        <button type="button">fora</button>
      </>,
    )

    screen.getByRole('button', { name: 'Sair' }).focus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'fora' })).toHaveFocus()
  })
})
