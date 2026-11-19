import { act, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/atoms/sonner'
import { server } from '@/test/msw/server'
import { simularLargura } from '@/test/media'
import { renderComProviders } from '@/test/utils'
import { AppShell } from './AppShell'
import { AppShellSkeleton } from './AppShellSkeleton'
import { AppShellProvider, useAppShellContext } from './AppShellContext'
import { AppShellView } from './AppShellView'

const navegacao = vi.hoisted(() => ({ caminho: '/dashboard', busca: '', replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  usePathname: () => navegacao.caminho,
  useRouter: () => ({ replace: navegacao.replace }),
  useSearchParams: () => new URLSearchParams(navegacao.busca),
}))
const acoes = vi.hoisted(() => ({ logoutAction: vi.fn(async () => {}) }))
vi.mock('@/actions/auth.actions', () => acoes)
const cookiesFalsos = vi.hoisted(() => ({ sidebar: undefined as string | undefined }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (cookiesFalsos.sidebar ? { value: cookiesFalsos.sidebar } : undefined) }),
}))

// O tooltip do Radix (trilho da sidebar) mede o gatilho com ResizeObserver, que o jsdom não tem
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

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
const barra = (container: HTMLElement) =>
  within(container.querySelector('[data-slot="app-shell-bottom-nav"]') as HTMLElement)
const topo = (container: HTMLElement) =>
  within(container.querySelector('[data-slot="app-shell-header"]') as HTMLElement)

describe('AppShell (Context + View)', () => {
  beforeEach(() => {
    navegacao.caminho = '/dashboard'
    navegacao.busca = ''
    navegacao.replace.mockClear()
    acoes.logoutAction.mockClear()
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
    expect(barra(container).getByRole('link', { name: 'Lançamentos' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Lixeira' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Lançamentos' })).toHaveAttribute('href', '/lancamentos')
    expect(screen.queryByRole('navigation', { name: 'Mês exibido' })).toBeNull()
    unmount()

    navegacao.caminho = '/lancamentos/novo'
    const formulario = renderizar()
    expect(formulario.container.querySelector('[data-slot="app-shell-bottom-nav"]')).toBeNull()
  })

  it('no celular, a TopBar mostra o mês da URL e troca o mês na URL', async () => {
    navegacao.busca = 'mes=1&ano=2026&tipo=DESPESA'
    const { container, usuario } = renderizar()

    const mes = topo(container).getByRole('navigation', { name: 'Mês exibido' })
    expect(mes).toHaveTextContent('Jan 2026')
    await usuario.click(within(mes).getByRole('button', { name: 'Mês anterior' }))

    expect(navegacao.replace).toHaveBeenCalledWith('/dashboard?mes=12&ano=2025&tipo=DESPESA', { scroll: false })
  })

  it('com o mês na URL, Dashboard e Lançamentos levam o mesmo mês; os outros destinos não', () => {
    navegacao.caminho = '/lancamentos'
    navegacao.busca = 'mes=3&ano=2026'
    const { container } = renderizar()

    const inferior = barra(container)
    expect(inferior.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/dashboard?mes=3&ano=2026')
    const lancamentos = inferior.getByRole('link', { name: 'Lançamentos' })
    expect(lancamentos).toHaveAttribute('href', '/lancamentos?mes=3&ano=2026')
    expect(lancamentos).toHaveAttribute('aria-current', 'page')
    expect(inferior.getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/categorias')
    expect(sidebar().getByRole('link', { name: 'Lançamentos' })).toHaveAttribute('aria-current', 'page')
  })

  it('o + da barra abre a folha Criar; Esc fecha', async () => {
    const { container, usuario } = renderizar()

    await usuario.click(barra(container).getByRole('button', { name: 'Criar' }))
    expect(screen.getByRole('dialog', { name: 'Criar' })).toBeInTheDocument()
    expect(barra(container).getByRole('button', { name: 'Fechar Criar', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(barra(container).getByRole('button', { name: 'Criar' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('"Nova categoria" na folha Criar abre o diálogo ali mesmo e cria a categoria', async () => {
    const enviados: unknown[] = []
    server.use(
      http.post('*/api/categorias', async ({ request }) => {
        const corpo = (await request.json()) as { descricao: string }
        enviados.push(corpo)
        return corpo.descricao === 'Mercado'
          ? HttpResponse.json({ status: 409, mensagem: 'Já existe uma categoria com essa descrição' }, { status: 409 })
          : corpo.descricao === 'Erro'
            ? HttpResponse.json({ status: 500, mensagem: 'Falhou no servidor.' }, { status: 500 })
            : HttpResponse.json({ id: 9, descricao: corpo.descricao, ativa: true }, { status: 201 })
      }),
    )
    const { container, usuario } = renderComProviders(
      <>
        <AppShellProvider sidebarRecolhida={false}>
          <AppShellView>tela</AppShellView>
        </AppShellProvider>
        <Toaster />
      </>,
    )

    await usuario.click(barra(container).getByRole('button', { name: 'Criar' }))
    await act(() => new Promise((r) => setTimeout(r, 350))) // trava de 300 ms ao abrir a folha
    await usuario.click(screen.getByRole('button', { name: /Nova categoria/ }))
    const dialogo = await screen.findByRole('dialog', { name: 'Nova categoria' })
    expect(navegacao.replace).not.toHaveBeenCalled()

    const nome = within(dialogo).getByLabelText(/Nome/)
    await usuario.type(nome, 'Mercado')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))
    expect(await within(dialogo).findByText('Já existe uma categoria com essa descrição')).toBeInTheDocument()

    await usuario.clear(nome)
    await usuario.type(nome, 'Erro')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))
    expect(
      (await screen.findAllByText('Não foi possível concluir a operação. Tente novamente.'))[0],
    ).toBeInTheDocument()

    await usuario.clear(nome)
    await usuario.type(nome, 'Pet')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))
    expect((await screen.findAllByText('Categoria criada'))[0]).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Nova categoria' })).toBeNull()
    expect(enviados).toEqual([{ descricao: 'Mercado' }, { descricao: 'Erro' }, { descricao: 'Pet' }])
  })

  it('Sair chama a logoutAction', async () => {
    simularLargura(1280)
    const { usuario } = renderizar()

    await usuario.click(sidebar().getByRole('button', { name: 'Sair' }))

    expect(acoes.logoutAction).toHaveBeenCalledOnce()
  })

  it('no tablet, com a sidebar aberta o Tab fica preso nela', async () => {
    simularLargura(834)
    const { usuario } = renderizar()

    await usuario.click(sidebar().getByRole('button', { name: 'Expandir menu' }))
    sidebar().getByRole('button', { name: 'Sair' }).focus()
    await usuario.tab()

    expect(sidebar().getByRole('link', { name: 'PoupaMais, ir para o Dashboard' })).toHaveFocus()
  })

  it('o avatar da TopBar usa a foto quando o usuário tem foto', async () => {
    server.use(
      http.get('*/api/usuarios/me', () =>
        HttpResponse.json({ id: 1, nome: 'Ana', email: 'ana@x.com', possuiFoto: true, dataCadastro: '2026-08-01' }),
      ),
    )
    let contexto: ReturnType<typeof useAppShellContext> | undefined
    function Espiao() {
      contexto = useAppShellContext()
      return null
    }
    const { container } = renderComProviders(
      <AppShellProvider sidebarRecolhida={false}>
        <Espiao />
        <AppShellView>tela</AppShellView>
      </AppShellProvider>,
    )

    await vi.waitFor(() => expect(contexto?.fotoUrl).toMatch(/^\/api\/usuarios\/me\/foto\?v=\d+$/))
    expect(topo(container).getByRole('link', { name: 'Seu perfil' })).toHaveAttribute('href', '/perfil')
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
