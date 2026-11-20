import { screen, waitFor, within } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { Toaster } from 'sonner'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { simularLargura } from '@/test/media'
import { lancamentosDemo, paginar, server } from '@/test/msw/server-e-dados'
import { renderComProviders } from '@/test/utils'
import type { Lancamento } from '@/types/api'
import { LixeiraProvider, useLixeiraContext } from './LixeiraContext'
import { LixeiraSkeleton } from './LixeiraSkeleton'
import { LixeiraView } from './LixeiraView'

const rota = vi.hoisted(() => ({ busca: '', replace: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: rota.replace, push: rota.push }),
  usePathname: () => '/lancamentos/lixeira',
  useSearchParams: () => new URLSearchParams(rota.busca),
}))
vi.mock('@/lib/baixar-arquivo', () => ({ salvarArquivo: vi.fn() }))
beforeAll(() => {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
})

const lixeira: Lancamento[] = [
  { ...lancamentosDemo[0], id: 9, descricao: 'Lanche', status: 'DELETADO', dataExclusao: '2026-11-16T12:20:00Z' },
  {
    ...lancamentosDemo[2],
    id: 8,
    descricao: 'Academia',
    data: '2026-09-03',
    status: 'DELETADO',
    dataExclusao: '2026-11-16T12:20:00Z',
  },
]

const renderizar = () =>
  renderComProviders(
    <>
      <LixeiraProvider>
        <LixeiraView />
      </LixeiraProvider>
      <Toaster />
    </>,
  )

describe('Lixeira', () => {
  beforeEach(() => {
    rota.busca = ''
    rota.replace.mockClear()
    rota.push.mockClear()
    server.use(
      msw.get('*/api/lancamentos', ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        return HttpResponse.json(paginar(status === 'DELETADO' ? lixeira : []))
      }),
    )
  })
  afterEach(() => vi.restoreAllMocks())

  it('lista a lixeira de todos os meses, com data com ano, aviso e sem switch', async () => {
    renderizar()
    expect(screen.getByLabelText('Carregando a lixeira')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '2 lançamentos na lixeira' })).toBeInTheDocument()
    expect(
      screen.getByText('Ao restaurar, o lançamento volta como estava antes de ir para a lixeira.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Restaurar devolve o lançamento para a lista, como estava antes de ir para a lixeira\./),
    ).toBeInTheDocument()
    expect(screen.getByText('3 set 2026')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Lixeira' })).toBeInTheDocument()
  })

  it('restaurar: POST, toast "Restaurado como inativo…" e Ver leva para o mês do lançamento', async () => {
    const restaurar = vi.fn()
    server.use(
      msw.post('*/api/lancamentos/:id/restaurar', ({ params }) => {
        restaurar(params.id)
        return HttpResponse.json({ ...lixeira[1], status: 'INATIVO', dataExclusao: null })
      }),
    )
    const { usuario } = renderizar()
    const tabela = within(await screen.findByRole('table', { name: 'Lançamentos na lixeira' }))
    await usuario.click(tabela.getByRole('button', { name: 'Restaurar Academia' }))
    expect(await screen.findByText('Restaurado como inativo. Ative para voltar ao dashboard.')).toBeInTheDocument()
    expect(restaurar).toHaveBeenCalledWith('8')
    await usuario.click(screen.getByRole('button', { name: 'Ver' }))
    expect(rota.push).toHaveBeenCalledWith('/lancamentos?mes=9&ano=2026')
  })

  it('restaurar com erro: toast de erro', async () => {
    server.use(
      msw.post('*/api/lancamentos/:id/restaurar', () =>
        HttpResponse.json({ status: 422, mensagem: 'Só é possível restaurar um lançamento excluído' }, { status: 422 }),
      ),
    )
    const { usuario } = renderizar()
    await screen.findByRole('heading', { name: '2 lançamentos na lixeira' })
    await usuario.click(screen.getAllByRole('button', { name: 'Restaurar Lanche' })[0])
    // 4xx: a mensagem da API como veio
    expect(await screen.findByText('Só é possível restaurar um lançamento excluído')).toBeInTheDocument()
  })

  it('vazia: "A lixeira está vazia" com Ver lançamentos', async () => {
    server.use(msw.get('*/api/lancamentos', () => HttpResponse.json(paginar([]))))
    renderizar()
    expect(await screen.findByRole('heading', { name: 'A lixeira está vazia' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver lançamentos' })).toHaveAttribute('href', '/lancamentos')
  })

  it('erro ao carregar', async () => {
    server.use(msw.get('*/api/lancamentos', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })))
    renderizar()
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('computador: a linha abre o painel em modo lixeira, com Restaurar', async () => {
    simularLargura(1280)
    const { usuario } = renderizar()
    const tabela = within(await screen.findByRole('table'))
    await usuario.click(tabela.getByRole('link', { name: 'Ver Lanche' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos/lixeira?ver=9', { scroll: false })
  })

  it.each(['ver=-3', 'ver=1.5', 'ver=abc'])('?%s inválido não abre o painel nem busca o lançamento', async (busca) => {
    rota.busca = busca
    const buscados: string[] = []
    server.use(
      msw.get('*/api/lancamentos/:id', ({ params }) => {
        buscados.push(String(params.id))
        return HttpResponse.json(lixeira[0])
      }),
    )
    renderizar()
    await screen.findAllByText(/na lixeira/)
    expect(screen.queryByRole('dialog', { name: 'Lançamento' })).toBeNull()
    expect(buscados).toEqual([])
  })

  it('painel aberto (?ver=9) e restaurar por ele fecha o painel', async () => {
    rota.busca = 'ver=9'
    server.use(
      msw.get('*/api/lancamentos/:id', () => HttpResponse.json(lixeira[0])),
      msw.post('*/api/lancamentos/:id/restaurar', () => HttpResponse.json({ ...lixeira[0], status: 'INATIVO' })),
    )
    const { usuario } = renderizar()
    const painel = within(await screen.findByRole('dialog', { name: 'Lançamento' }))
    expect(await painel.findByText(/Este lançamento está na lixeira/)).toBeInTheDocument()
    await usuario.click(painel.getByRole('button', { name: 'Restaurar' }))
    await waitFor(() => expect(rota.replace).toHaveBeenLastCalledWith('/lancamentos/lixeira', { scroll: false }))
  })

  it('não tem Exportar (a prancheta da Lixeira não tem)', async () => {
    renderizar()
    await screen.findByRole('heading', { name: '2 lançamentos na lixeira' })
    expect(screen.queryByRole('button', { name: /Exportar/ })).not.toBeInTheDocument()
  })

  it('sem internet e o esqueleto; o Context exige o Provider', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderizar()
    expect(screen.getByText(/Sem internet agora/)).toBeInTheDocument()
    const [restaurar] = await screen.findAllByRole('button', { name: 'Restaurar Lanche' })
    expect(restaurar).toHaveAttribute('aria-disabled', 'true')

    renderComProviders(<LixeiraSkeleton />)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useLixeiraContext()
      return null
    }
    expect(() => renderComProviders(<SemProvider />)).toThrow(/<LixeiraProvider>/)
  })
})
