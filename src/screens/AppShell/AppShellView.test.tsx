import { act, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { simularLargura } from '@/test/media'
import { renderComProviders } from '@/test/utils'
import { AppShell } from './AppShell'
import { AppShellSkeleton } from './AppShellSkeleton'
import { AppShellProvider, useAppShellContext } from './AppShellContext'
import { AppShellView } from './AppShellView'

const navegacao = vi.hoisted(() => ({ caminho: '/dashboard' }))
vi.mock('next/navigation', () => ({ usePathname: () => navegacao.caminho }))
const cookiesFalsos = vi.hoisted(() => ({ sidebar: undefined as string | undefined }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (cookiesFalsos.sidebar ? { value: cookiesFalsos.sidebar } : undefined) }),
}))

function renderizar(sidebarRecolhida = false) {
  return renderComProviders(
    <AppShellProvider sidebarRecolhida={sidebarRecolhida}>
      <AppShellView>
        <p>conteúdo da tela</p>
      </AppShellView>
    </AppShellProvider>,
  )
}

const casca = (container: HTMLElement) => container.querySelector('[data-slot="app-shell"]') as HTMLElement
const sidebar = () => within(document.getElementById('sidebar') as HTMLElement)

describe('AppShell (Context + View)', () => {
  beforeEach(() => {
    navegacao.caminho = '/dashboard'
    document.cookie = 'sidebar=; path=/; max-age=0'
  })

  it('monta a casca com a navegação, o título do celular e o conteúdo', async () => {
    renderizar()

    expect(screen.getByRole('main')).toHaveTextContent('conteúdo da tela')
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument()
    expect(sidebar().getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  it('no computador, recolher grava o cookie e muda o estado da casca', async () => {
    simularLargura(1280)
    const { container, usuario } = renderizar()

    await usuario.click(sidebar().getByRole('button', { name: 'Recolher menu' }))

    expect(casca(container)).toHaveAttribute('data-sidebar-recolhida', 'true')
    expect(document.cookie).toContain('sidebar=recolhida')
    expect(sidebar().getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false')

    await usuario.click(sidebar().getByRole('button', { name: 'Expandir menu' }))
    expect(document.cookie).toContain('sidebar=expandida')
  })

  it('começa recolhida quando o cookie diz isso', () => {
    simularLargura(1280)
    const { container } = renderizar(true)

    expect(casca(container)).toHaveAttribute('data-sidebar-recolhida', 'true')
  })

  it('no tablet, expandir abre por cima sem gravar cookie; escolher um item fecha', async () => {
    simularLargura(834)
    const { container, usuario } = renderizar()

    await usuario.click(sidebar().getByRole('button', { name: 'Expandir menu' }))
    expect(casca(container)).toHaveAttribute('data-sidebar-aberta', 'true')
    expect(document.cookie).not.toContain('sidebar=')

    const perfil = sidebar().getByRole('link', { name: 'Perfil' })
    perfil.addEventListener('click', (evento) => evento.preventDefault())
    await usuario.click(perfil)
    expect(casca(container)).toHaveAttribute('data-sidebar-aberta', 'false')
  })

  it('nas subtelas de Lançamentos a barra inferior marca Lançamentos; no formulário ela some', () => {
    navegacao.caminho = '/lancamentos/lixeira'
    const { container, unmount } = renderizar()
    const barra = within(container.querySelector('[data-slot="app-shell-bottom-nav"]') as HTMLElement)
    expect(barra.getByRole('link', { name: 'Lançamentos' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Lixeira' })).toBeInTheDocument()
    unmount()

    navegacao.caminho = '/lancamentos/novo'
    const formulario = renderizar()
    expect(formulario.container.querySelector('[data-slot="app-shell-bottom-nav"]')).toBeNull()
  })

  it('carrega o usuário logado para a navegação', async () => {
    let contexto: ReturnType<typeof useAppShellContext> | undefined
    function Espiao() {
      contexto = useAppShellContext()
      return null
    }
    renderComProviders(
      <AppShellProvider sidebarRecolhida={false}>
        <Espiao />
      </AppShellProvider>,
    )

    await vi.waitFor(() => expect(contexto?.usuario?.nome).toBe('Usuário Demo'))
  })

  it('useAppShellContext fora do Provider dá erro claro', () => {
    function SemProvider() {
      useAppShellContext()
      return null
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderComProviders(<SemProvider />)).toThrow(/dentro de <AppShellProvider>/)
  })

  it('AppShell (servidor) lê o cookie da sidebar', async () => {
    simularLargura(1280)
    cookiesFalsos.sidebar = 'recolhida'
    const elemento = await AppShell({ children: <p>tela</p> })
    const { container } = renderComProviders(elemento)

    expect(casca(container)).toHaveAttribute('data-sidebar-recolhida', 'true')
    cookiesFalsos.sidebar = undefined
  })

  it('o esqueleto mostra a casca carregando', () => {
    renderComProviders(<AppShellSkeleton />)

    expect(screen.getByLabelText('Carregando')).toHaveAttribute('aria-busy', 'true')
  })

  it('a casca acompanha a troca de largura', async () => {
    const { container, usuario } = renderizar()
    act(() => simularLargura(1280))

    await usuario.click(sidebar().getByRole('button', { name: 'Recolher menu' }))
    expect(casca(container)).toHaveAttribute('data-sidebar-recolhida', 'true')
  })
})
