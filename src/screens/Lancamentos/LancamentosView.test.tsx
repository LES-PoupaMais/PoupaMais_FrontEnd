import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { Toaster } from 'sonner'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { simularLargura } from '@/test/media'
import { lancamentosDemo, paginar, server } from '@/test/msw/server-e-dados'
import { renderComProviders } from '@/test/utils'
import type { Lancamento } from '@/types/api'
import { LancamentosProvider, useLancamentosContext } from './LancamentosContext'
import { LancamentosSkeleton } from './LancamentosSkeleton'
import { LancamentosView } from './LancamentosView'

const rota = vi.hoisted(() => ({ busca: 'mes=11&ano=2026', replace: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: rota.replace, push: rota.push }),
  usePathname: () => '/lancamentos',
  useSearchParams: () => new URLSearchParams(rota.busca),
}))
vi.mock('@/lib/baixar-arquivo', () => ({ salvarArquivo: vi.fn() }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

const renderizar = () =>
  renderComProviders(
    <>
      <LancamentosProvider>
        <LancamentosView />
      </LancamentosProvider>
      <Toaster />
    </>,
  )

/** A lista (cards) fica no celular/tablet; a tabela no computador. No jsdom as duas existem. */
const cards = () => within(screen.getByRole('region', { name: /^Lançamentos de novembro de 2026/ }))
const barra = () => within(screen.getAllByRole('search', { name: 'Filtrar lançamentos' })[0])

describe('Lançamentos', () => {
  beforeEach(() => {
    rota.busca = 'mes=11&ano=2026'
    rota.replace.mockClear()
    rota.push.mockClear()
  })
  afterEach(() => vi.restoreAllMocks())

  it('carrega e mostra os cards, a tabela e o total do mês', async () => {
    renderizar()
    expect(screen.getByLabelText('Carregando lançamentos')).toBeInTheDocument()
    await screen.findAllByRole('link', { name: 'Ver Salário' })
    expect(cards().getByRole('link', { name: 'Ver Salário' })).toHaveAttribute('href', '/lancamentos/2')
    expect(screen.getByRole('table', { name: 'Lançamentos de novembro de 2026' })).toBeInTheDocument()
    expect(barra().getByRole('status')).toHaveTextContent('5 lançamentos')
    expect(screen.getByRole('heading', { level: 1, name: 'Lançamentos' })).toBeInTheDocument()
    expect(screen.getByText('Receitas e despesas de novembro de 2026')).toBeInTheDocument()
    expect(screen.getAllByText('Mostrando 5 de 5')).toHaveLength(1)
  })

  it('manda os filtros da URL para a API', async () => {
    rota.busca = 'mes=10&ano=2026&q=mer&tipo=DESPESA&status=INATIVO&categoria=2'
    let busca = new URLSearchParams()
    server.use(
      msw.get('*/api/lancamentos', ({ request }) => {
        busca = new URL(request.url).searchParams
        return HttpResponse.json(paginar(lancamentosDemo.slice(0, 1)))
      }),
    )
    renderizar()
    await screen.findAllByRole('link', { name: 'Ver Feira e padaria' })
    expect(Object.fromEntries(busca)).toMatchObject({
      mes: '10',
      ano: '2026',
      descricao: 'mer',
      tipo: 'DESPESA',
      status: 'INATIVO',
      categoriaId: '2',
    })
    expect(screen.getByText('“mer” · Despesa · Mercado · Inativos')).toBeInTheDocument()
  })

  it('mês vazio: EmptyState com Novo lançamento', async () => {
    server.use(msw.get('*/api/lancamentos', () => HttpResponse.json(paginar([]))))
    renderizar()
    expect(await screen.findByRole('heading', { name: 'Não há lançamentos em Novembro 2026' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Novo lançamento' })).toHaveAttribute('href', '/lancamentos/novo')
  })

  it('busca sem resultado: "Nada encontrado" e Limpar filtros tira os filtros da URL', async () => {
    rota.busca = 'mes=11&ano=2026&q=padaria&tipo=RECEITA'
    server.use(msw.get('*/api/lancamentos', () => HttpResponse.json(paginar([]))))
    const { usuario } = renderizar()
    expect(await screen.findByRole('heading', { name: 'Nada encontrado para “padaria”' })).toBeInTheDocument()
    const vazio = screen
      .getByRole('heading', { name: 'Nada encontrado para “padaria”' })
      .closest('section') as HTMLElement
    await usuario.click(within(vazio).getByRole('button', { name: 'Limpar filtros' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos?mes=11&ano=2026', { scroll: false })
  })

  it('filtros sem busca e sem resultado', async () => {
    rota.busca = 'mes=11&ano=2026&tipo=RECEITA'
    server.use(msw.get('*/api/lancamentos', () => HttpResponse.json(paginar([]))))
    renderizar()
    expect(await screen.findByRole('heading', { name: 'Nada encontrado com esses filtros' })).toBeInTheDocument()
  })

  it('erro: ErrorState com Tentar de novo', async () => {
    let falhar = true
    server.use(
      msw.get('*/api/lancamentos', () =>
        falhar
          ? HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })
          : HttpResponse.json(paginar(lancamentosDemo)),
      ),
    )
    const { usuario } = renderizar()
    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar' })).toBeInTheDocument()
    falhar = false
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findAllByRole('link', { name: 'Ver Salário' })).not.toHaveLength(0)
  })

  it('Conta no saldo: desliga na hora, envia o PATCH e mostra o toast', async () => {
    let corpo: unknown
    server.use(
      msw.patch('*/api/lancamentos/:id/status', async ({ request, params }) => {
        corpo = await request.json()
        return HttpResponse.json({ ...lancamentosDemo[0], id: Number(params.id), status: 'INATIVO' })
      }),
    )
    const { usuario } = renderizar()
    const chave = await screen.findByRole('switch', { name: 'Conta no saldo: Salário' })
    await usuario.click(chave)
    expect(corpo).toEqual({ status: 'INATIVO' })
    expect(await screen.findByText('Lançamento fora do saldo. Ele continua na lista.')).toBeInTheDocument()
  })

  it('Conta no saldo com erro: toast de erro', async () => {
    server.use(
      msw.patch('*/api/lancamentos/:id/status', () =>
        HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }),
      ),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('switch', { name: 'Conta no saldo: Mercado do mês' }))
    expect(await screen.findByText('Não foi possível mudar Conta no saldo.')).toBeInTheDocument()
  })

  it('mover para a lixeira: o DELETE vai na hora, a linha some e o Desfazer restaura', async () => {
    const chamadas: string[] = []
    let naLixeira = false
    server.use(
      msw.get('*/api/lancamentos', () =>
        HttpResponse.json(
          paginar(lancamentosDemo.filter((l) => l.status !== 'DELETADO' && (!naLixeira || l.id !== 2))),
        ),
      ),
      msw.delete('*/api/lancamentos/:id', ({ params }) => {
        chamadas.push(`DELETE ${params.id}`)
        naLixeira = true
        return new HttpResponse(null, { status: 204 })
      }),
      msw.post('*/api/lancamentos/:id/restaurar', ({ params }) => {
        chamadas.push(`restaurar ${params.id}`)
        naLixeira = false
        return HttpResponse.json({ ...lancamentosDemo.find((l) => l.id === 2), status: 'ATIVO' })
      }),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Mover Salário para a lixeira' }))
    expect(screen.queryByRole('switch', { name: 'Conta no saldo: Salário' })).not.toBeInTheDocument()
    expect(barra().getByRole('status')).toHaveTextContent('4 lançamentos')
    expect(await screen.findByText('Movido para a lixeira')).toBeInTheDocument()
    // Mesmo toast de antes: contador de 5 s
    expect(screen.getByText('5 s')).toBeInTheDocument()
    await waitFor(() => expect(chamadas).toEqual(['DELETE 2']))

    await usuario.click(screen.getByRole('button', { name: 'Desfazer' }))
    await waitFor(() => expect(chamadas).toEqual(['DELETE 2', 'restaurar 2']))
    expect(await screen.findByRole('switch', { name: 'Conta no saldo: Salário' })).toBeInTheDocument()
  })

  it('mover para a lixeira com erro no DELETE: aviso e a linha volta', async () => {
    server.use(
      msw.delete('*/api/lancamentos/:id', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Mover Salário para a lixeira' }))
    expect(await screen.findByText('Não foi possível mover para a lixeira.')).toBeInTheDocument()
    expect(await screen.findByRole('switch', { name: 'Conta no saldo: Salário' })).toBeInTheDocument()
  })

  it('Desfazer com erro no restaurar: aviso e a lista é recarregada', async () => {
    let leituras = 0
    server.use(
      msw.get('*/api/lancamentos', () => {
        leituras += 1
        return HttpResponse.json(paginar(lancamentosDemo.filter((l) => l.status !== 'DELETADO')))
      }),
      msw.delete('*/api/lancamentos/:id', () => new HttpResponse(null, { status: 204 })),
      msw.post('*/api/lancamentos/:id/restaurar', () =>
        HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }),
      ),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Mover Salário para a lixeira' }))
    await waitFor(() => expect(leituras).toBeGreaterThanOrEqual(2)) // recarregou depois do DELETE
    const antes = leituras
    await usuario.click(await screen.findByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByText('Não foi possível restaurar.')).toBeInTheDocument()
    await waitFor(() => expect(leituras).toBeGreaterThan(antes))
  })

  it('computador: tocar na linha abre o painel (?ver=) em vez de navegar', async () => {
    simularLargura(1280)
    const { usuario } = renderizar()
    const tabela = within(await screen.findByRole('table'))
    await usuario.click(tabela.getByRole('link', { name: 'Ver Salário' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos?mes=11&ano=2026&ver=2', { scroll: false })
  })

  it('painel aberto (?ver=3): visualização com Editar, mover para a lixeira fecha o painel', async () => {
    simularLargura(1280)
    rota.busca = 'mes=11&ano=2026&ver=3'
    const { usuario } = renderizar()
    const painel = within(await screen.findByRole('dialog', { name: 'Lançamento' }))
    expect(await painel.findByRole('heading', { name: 'Mercado do mês' })).toBeInTheDocument()
    expect(painel.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/lancamentos/3/editar')
    await usuario.click(painel.getByRole('button', { name: 'Mover para a lixeira' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos?mes=11&ano=2026', { scroll: false })
    // o painel continua aberto no teste (a URL é falsa): clica direto no Desfazer do toast
    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }))
  })

  it('painel com erro ao carregar um lançamento que não está na lista', async () => {
    rota.busca = 'mes=11&ano=2026&ver=99'
    renderizar()
    const painel = within(await screen.findByRole('dialog', { name: 'Lançamento' }))
    expect(await painel.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('Mostrar mais: carrega a próxima página e atualiza o contador', async () => {
    const muitos: Lancamento[] = Array.from({ length: 15 }, (_, i) => ({
      ...lancamentosDemo[0],
      id: 100 + i,
      descricao: `Compra ${i + 1}`,
    }))
    server.use(
      msw.get('*/api/lancamentos', ({ request }) => {
        const p = new URL(request.url).searchParams
        return HttpResponse.json(paginar(muitos, Number(p.get('pagina')), Number(p.get('tamanho'))))
      }),
    )
    const { usuario } = renderizar()
    await screen.findAllByRole('link', { name: 'Ver Compra 1' })
    expect(cards().getByText('Mostrando 12 de 15')).toBeInTheDocument()
    await usuario.click(cards().getByRole('button', { name: 'Mostrar mais' }))
    expect(await cards().findByText('Mostrando 15 de 15')).toBeInTheDocument()
    expect(cards().queryByRole('button', { name: 'Mostrar mais' })).not.toBeInTheDocument()
  })

  it('exportar: diálogo com os filtros ativos e download com os mesmos filtros', async () => {
    rota.busca = 'mes=11&ano=2026&tipo=DESPESA'
    let busca = new URLSearchParams()
    server.use(
      msw.get('*/api/lancamentos/exportar', ({ request }) => {
        busca = new URL(request.url).searchParams
        return new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } })
      }),
    )
    const { usuario } = renderizar()
    await screen.findAllByRole('link', { name: 'Ver Salário' })
    await usuario.click(barra().getByRole('button', { name: 'Exportar' }))
    const dialogo = within(screen.getByRole('dialog', { name: 'Exportar lançamentos' }))
    expect(
      dialogo.getByText('O arquivo segue os filtros ativos: Novembro 2026 · Despesa · Todos os status'),
    ).toBeInTheDocument()
    await usuario.click(dialogo.getByRole('radio', { name: 'Excel' }))
    await usuario.click(dialogo.getByRole('button', { name: 'Baixar arquivo' }))
    expect(await screen.findByText('Arquivo exportado')).toBeInTheDocument()
    expect(Object.fromEntries(busca)).toMatchObject({ formato: 'xlsx', mes: '11', ano: '2026', tipo: 'DESPESA' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Exportar lançamentos' })).not.toBeInTheDocument())
  })

  it('exportar com erro e baixar o modelo CSV', async () => {
    server.use(
      msw.get('*/api/lancamentos/exportar', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })),
      msw.get(
        '*/api/lancamentos/template-csv',
        () => new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } }),
      ),
    )
    const { usuario } = renderizar()
    await screen.findAllByRole('link', { name: 'Ver Salário' })
    await usuario.click(barra().getByRole('button', { name: 'Exportar' }))
    await usuario.click(screen.getByRole('button', { name: 'Baixar arquivo' }))
    expect(await screen.findByText('Não foi possível exportar.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Mudar filtros' }))
    await usuario.click(barra().getByRole('button', { name: /Importar/ }))
    await usuario.click(await screen.findByRole('menuitem', { name: 'Baixar modelo CSV' }))
    expect(await screen.findByText('Modelo CSV baixado')).toBeInTheDocument()
  })

  it('mês e status pela barra escrevem na URL; Lixeira leva para a Lixeira', async () => {
    const { usuario } = renderizar()
    await screen.findAllByRole('link', { name: 'Ver Salário' })
    await usuario.click(barra().getByRole('button', { name: 'Mês anterior' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos?mes=10&ano=2026', { scroll: false })
    await usuario.click(barra().getByRole('radio', { name: 'Ativos' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos?mes=11&ano=2026&status=ATIVO', { scroll: false })
    await usuario.click(barra().getByRole('radio', { name: 'Lixeira' }))
    expect(rota.push).toHaveBeenCalledWith('/lancamentos/lixeira')
  })

  it('sem internet: OfflineBanner e o que grava desabilitado', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderizar()
    // A faixa "Sem internet agora…" fica no topo da casca (AppShell); a tela só bloqueia o que grava
    expect(screen.queryByText(/Sem internet agora/)).not.toBeInTheDocument()
    expect(await screen.findByRole('switch', { name: 'Conta no saldo: Salário' })).toBeDisabled()
  })

  it('o esqueleto da rota e o Context exige o Provider', () => {
    renderComProviders(<LancamentosSkeleton />)
    expect(screen.getByLabelText('Carregando lançamentos')).toBeInTheDocument()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useLancamentosContext()
      return null
    }
    expect(() => renderComProviders(<SemProvider />)).toThrow(/<LancamentosProvider>/)
  })
})
