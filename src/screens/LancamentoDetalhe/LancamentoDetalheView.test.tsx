import { fireEvent, screen } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { Toaster } from 'sonner'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { lancamentosDemo, server } from '@/test/msw/server-e-dados'
import { renderComProviders } from '@/test/utils'
import { LancamentoDetalheProvider, useLancamentoDetalheContext } from './LancamentoDetalheContext'
import { LancamentoDetalheSkeleton } from './LancamentoDetalheSkeleton'
import { LancamentoDetalheView } from './LancamentoDetalheView'

const rota = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: rota.push, replace: vi.fn() }) }))
beforeAll(() => {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
})

const renderizar = (id = 3) =>
  renderComProviders(
    <>
      <LancamentoDetalheProvider id={id}>
        <LancamentoDetalheView />
      </LancamentoDetalheProvider>
      <Toaster />
    </>,
  )

describe('Visualizar lançamento', () => {
  beforeEach(() => rota.push.mockClear())
  afterEach(() => vi.restoreAllMocks())

  it('mostra o lançamento com o título h1, Editar e o voltar para o mês', async () => {
    renderizar()
    expect(await screen.findByRole('heading', { level: 1, name: 'Mercado do mês' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/lancamentos/3/editar')
    expect(screen.getByRole('link', { name: 'Lançamentos' })).toHaveAttribute('href', '/lancamentos?mes=11&ano=2026')
  })

  it('Conta no saldo: PATCH e toast', async () => {
    server.use(
      msw.patch('*/api/lancamentos/:id/status', () => HttpResponse.json({ ...lancamentosDemo[2], status: 'INATIVO' })),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('switch', { name: 'Conta no saldo' }))
    expect(await screen.findByText('Lançamento fora do saldo. Ele continua na lista.')).toBeInTheDocument()
  })

  it('Conta no saldo com erro', async () => {
    server.use(
      msw.patch('*/api/lancamentos/:id/status', () =>
        HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }),
      ),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('switch', { name: 'Conta no saldo' }))
    expect(await screen.findByText('Não foi possível mudar Conta no saldo.')).toBeInTheDocument()
  })

  it('mover para a lixeira volta para a lista do mês com o toast Desfazer', async () => {
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Mover para a lixeira' }))
    expect(rota.push).toHaveBeenCalledWith('/lancamentos?mes=11&ano=2026')
    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }))
  })

  it('na lixeira: aviso, voltar para a Lixeira e Restaurar com toast', async () => {
    server.use(
      msw.get('*/api/lancamentos/:id', () =>
        HttpResponse.json({ ...lancamentosDemo[2], status: 'DELETADO', dataExclusao: '2026-11-16T12:20:00Z' }),
      ),
      msw.post('*/api/lancamentos/:id/restaurar', () =>
        HttpResponse.json({ ...lancamentosDemo[2], status: 'INATIVO' }),
      ),
    )
    const { usuario } = renderizar()
    expect(await screen.findByText(/Este lançamento está na lixeira/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lixeira' })).toHaveAttribute('href', '/lancamentos/lixeira')
    expect(screen.getByRole('link', { name: 'Ver a lixeira' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText('Restaurado como inativo. Ative para voltar ao dashboard.')).toBeInTheDocument()
  })

  it('restaurar com erro', async () => {
    server.use(
      msw.get('*/api/lancamentos/:id', () => HttpResponse.json({ ...lancamentosDemo[2], status: 'DELETADO' })),
      msw.post('*/api/lancamentos/:id/restaurar', () =>
        HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }),
      ),
    )
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText('Não foi possível restaurar.')).toBeInTheDocument()
  })

  it('404 e id inválido: "Lançamento não encontrado"', async () => {
    renderizar(999)
    expect(await screen.findByRole('heading', { name: 'Lançamento não encontrado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver lançamentos' })).toHaveAttribute('href', '/lancamentos')
  })

  it('erro ao carregar com Tentar de novo; sem internet; esqueleto e Provider', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    server.use(
      msw.get('*/api/lancamentos/:id', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })),
    )
    renderizar()
    expect(screen.getByText(/Sem internet agora/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()

    renderComProviders(<LancamentoDetalheSkeleton />)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useLancamentoDetalheContext()
      return null
    }
    expect(() => renderComProviders(<SemProvider />)).toThrow(/<LancamentoDetalheProvider>/)
  })
})
