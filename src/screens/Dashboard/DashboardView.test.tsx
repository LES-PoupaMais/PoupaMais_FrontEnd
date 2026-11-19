import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lerFiltros } from '@/screens/Lancamentos/filtrosDaUrl'
import { dashboardDemo } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderComProviders } from '@/test/utils'
import { DashboardProvider, useDashboardContext } from './DashboardContext'
import { DashboardSkeleton } from './DashboardSkeleton'
import { DashboardView } from './DashboardView'

const rota = vi.hoisted(() => ({ busca: 'mes=11&ano=2026', replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: rota.replace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(rota.busca),
}))

const renderizar = () =>
  renderComProviders(
    <DashboardProvider>
      <DashboardView />
    </DashboardProvider>,
  )

const vazio = {
  ...dashboardDemo,
  receitas: 0,
  despesas: 0,
  saldo: 0,
  taxaGasto: null,
  classificacaoTaxa: null,
  mensagem: 'Ainda não há lançamentos neste mês.',
  despesasPorCategoria: [],
  maioresDespesas: [],
  pesoMaioresDespesas: { valor: 0, percentual: null },
}

describe('Dashboard', () => {
  beforeEach(() => {
    rota.busca = 'mes=11&ano=2026'
    rota.replace.mockClear()
  })
  afterEach(() => vi.restoreAllMocks())

  it('carrega e mostra saldo, tiles, gráficos e maiores despesas do mês', async () => {
    renderizar()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o resumo do mês…')

    const saldo = await screen.findByRole('article', { name: 'Saldo do mês de novembro de 2026' })
    expect(saldo).toHaveTextContent('+ R$ 4.920,00')
    expect(saldo).toHaveTextContent(dashboardDemo.mensagem)
    const resumo = screen.getByRole('list', { name: 'Resumo de novembro de 2026' })
    expect(resumo).toHaveTextContent('R$ 12.480,50')
    expect(resumo).toHaveTextContent('60,6%')
    expect(resumo).toHaveTextContent('Dentro do limite')
    expect(screen.getByRole('region', { name: 'Receitas × Despesas' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Saldo mensal' })).toBeInTheDocument()
    const mercado = within(screen.getByRole('region', { name: 'Despesas por categoria' })).getByRole('link', {
      name: /Ver lançamentos de Mercado/,
    })
    expect(mercado).toHaveAttribute('href', '/lancamentos?categoria=2&mes=11&ano=2026&tipo=DESPESA')
    // A tela de Lançamentos aplica o filtro que o link leva (mesmo nome de parâmetro)
    const busca = new URL(mercado.getAttribute('href')!, 'http://localhost').searchParams
    expect(lerFiltros(busca)).toMatchObject({ categoriaId: 2, tipo: 'DESPESA' })
    expect(screen.getByRole('region', { name: 'Maiores despesas' })).toHaveTextContent('64,7% das despesas do mês')
    expect(await screen.findByText('Olá, Usuário')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('mês sem lançamentos mostra o primeiro passo', async () => {
    server.use(http.get('*/api/dashboard', () => HttpResponse.json(vazio)))
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Comece pelo seu primeiro lançamento' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar primeiro lançamento' })).toHaveAttribute('href', '/lancamentos/novo')
    expect(screen.getByRole('link', { name: 'Importar CSV' })).toHaveAttribute('href', '/lancamentos/importar')
    // Baixa direto (useBaixarModeloCsv), como em Lançamentos e Importar
    server.use(
      http.get(
        '*/api/lancamentos/template-csv',
        () => new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } }),
      ),
    )
    const criarUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:modelo')
    await userEvent.click(screen.getByRole('button', { name: 'Baixar modelo CSV' }))
    await waitFor(() => expect(criarUrl).toHaveBeenCalledOnce())
    expect(screen.getAllByText('Novembro 2026 ainda não tem lançamentos.', { exact: false }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('region', { name: 'Saldo mensal' })).toBeNull()
  })

  it('erro mostra "Tentar de novo", que busca de novo', async () => {
    let falhar = true
    server.use(
      http.get('*/api/dashboard', () =>
        falhar
          ? HttpResponse.json({ status: 500, mensagem: 'Erro' }, { status: 500 })
          : HttpResponse.json(dashboardDemo),
      ),
    )
    const { usuario } = renderizar()

    const erro = await screen.findByRole('alert')
    expect(erro).toHaveTextContent('Não foi possível carregar o dashboard')
    falhar = false
    await usuario.click(within(erro).getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('article', { name: 'Saldo do mês de novembro de 2026' })).toBeInTheDocument()
  })

  it('sem conexão mostra o aviso e mantém os dados', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderizar()

    expect(await screen.findByText(/Sem internet agora/)).toBeInTheDocument()
    expect(await screen.findByRole('article', { name: /Saldo do mês/ })).toBeInTheDocument()
  })

  it('troca de mês escrevendo na URL, sem perder os outros parâmetros', async () => {
    rota.busca = 'mes=1&ano=2026&origem=x'
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/dashboard?mes=12&ano=2025&origem=x', { scroll: false })

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/dashboard?mes=2&ano=2026&origem=x', { scroll: false })
  })

  it('trocar de mês: carregando e aria-busy até o mês novo chegar (não mostra os números do mês anterior)', async () => {
    let liberar: () => void = () => {}
    const segurar = new Promise<void>((r) => {
      liberar = r
    })
    server.use(
      http.get('*/api/dashboard', async ({ request }) => {
        const params = new URL(request.url).searchParams
        const mes = Number(params.get('mes'))
        if (mes === 10) await segurar
        return HttpResponse.json(mes === 10 ? { ...vazio, mes: 10, ano: 2026 } : { ...dashboardDemo, mes, ano: 2026 })
      }),
    )
    const { rerender, queryClient } = renderizar()
    expect(await screen.findByRole('article', { name: 'Saldo do mês de novembro de 2026' })).toBeInTheDocument()

    rota.busca = 'mes=10&ano=2026'
    rerender(
      <QueryClientProvider client={queryClient}>
        <DashboardProvider>
          <DashboardView />
        </DashboardProvider>
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Carregando o resumo do mês…')
    expect(screen.queryByRole('article', { name: 'Saldo do mês de novembro de 2026' })).toBeNull()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()

    liberar()
    // Mês vazio: a frase usa o mês do dado que chegou
    expect(await screen.findAllByText('Outubro 2026 ainda não tem lançamentos.', { exact: false })).not.toHaveLength(0)
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })

  it('o esqueleto ocupa a grade e o Context exige o Provider', () => {
    const { container } = render(<DashboardSkeleton />)
    expect(container.querySelector('[data-slot="dashboard-grade"]')).not.toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o resumo do mês…')

    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useDashboardContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<DashboardProvider>/)
  })
})
