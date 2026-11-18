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
    expect(screen.getByText('Itens restaurados voltam fora do saldo.')).toBeInTheDocument()
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
        HttpResponse.json({ status: 422, mensagem: 'x' }, { status: 422 }),
      ),
    )
    const { usuario } = renderizar()
    await screen.findByRole('heading', { name: '2 lançamentos na lixeira' })
    await usuario.click(screen.getAllByRole('button', { name: 'Restaurar Lanche' })[0])
    expect(await screen.findByText('Não foi possível restaurar.')).toBeInTheDocument()
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

  it('exportar a lixeira manda status=DELETADO sem mês', async () => {
    let busca = new URLSearchParams()
    server.use(
      msw.get('*/api/lancamentos/exportar', ({ request }) => {
        busca = new URL(request.url).searchParams
        return new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } })
      }),
    )
    const { usuario } = renderizar()
    await screen.findByRole('heading', { name: '2 lançamentos na lixeira' })
    await usuario.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(screen.getByText('Só os lançamentos da lixeira, de todos os meses.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Baixar arquivo' }))
    expect(await screen.findByText('Arquivo exportado')).toBeInTheDocument()
    expect(Object.fromEntries(busca)).toEqual({ formato: 'csv', status: 'DELETADO' })
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
