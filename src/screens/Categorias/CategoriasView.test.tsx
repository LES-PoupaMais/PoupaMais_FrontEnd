import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/atoms/sonner'
import { categoriasDemo, server } from '@/test/msw/server-e-dados'
import { renderComProviders } from '@/test/utils'
import { CategoriasProvider, useCategoriasContext } from './CategoriasContext'
import { CategoriasSkeleton } from './CategoriasSkeleton'
import { CategoriasView } from './CategoriasView'

const navegacao = vi.hoisted(() => ({ busca: 'mes=11&ano=2026' }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(navegacao.busca) }))

function renderizar() {
  return renderComProviders(
    <>
      <CategoriasProvider>
        <CategoriasView />
      </CategoriasProvider>
      <Toaster />
    </>,
  )
}

const cartoes = () => within(document.querySelector('[data-slot="categoria-lista-cartoes"]') as HTMLElement)
/** Espera a lista chegar e devolve os cards (o jsdom mostra cards e tabela juntos) */
async function lista() {
  await screen.findAllByText('Aluguel')
  return cartoes()
}
const naLista = async (...args: Parameters<ReturnType<typeof cartoes>['findByRole']>) =>
  (await lista()).findByRole(...args)

describe('Categorias (Context + View)', () => {
  beforeEach(() => {
    navegacao.busca = 'mes=11&ano=2026'
  })
  afterEach(() => vi.restoreAllMocks())

  it('carrega a lista com a contagem do mês da URL', async () => {
    let pedido: URL | undefined
    server.use(
      http.get('*/api/categorias', ({ request }) => {
        pedido = new URL(request.url)
        return HttpResponse.json(categoriasDemo)
      }),
    )
    renderizar()

    expect(screen.getByLabelText('Carregando categorias')).toBeInTheDocument()
    expect(await naLista('heading', { name: 'Ativas · 3' })).toBeInTheDocument()
    expect(cartoes().getByText('Lançamentos em Nov/2026')).toBeInTheDocument()
    expect(pedido?.searchParams.get('mes')).toBe('11')
    expect(pedido?.searchParams.get('ano')).toBe('2026')
  })

  it('vazio: convida a criar a primeira ou importar', async () => {
    server.use(http.get('*/api/categorias', () => HttpResponse.json([])))
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Você ainda não tem categorias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Importar CSV com categorias' })).toHaveAttribute(
      'href',
      '/lancamentos/importar',
    )
    expect(screen.getByRole('button', { name: 'Nova categoria' })).toBeInTheDocument()
  })

  it('erro: Tentar de novo busca outra vez', async () => {
    let tentativas = 0
    server.use(
      http.get('*/api/categorias', () => {
        tentativas += 1
        return tentativas === 1
          ? HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })
          : HttpResponse.json(categoriasDemo)
      }),
    )
    const { usuario } = renderizar()

    await usuario.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
    expect(await naLista('heading', { name: 'Ativas · 3' })).toBeInTheDocument()
  })

  it('cria uma categoria; nome repetido (409) aparece no diálogo', async () => {
    let enviados: unknown[] = []
    server.use(
      http.post('*/api/categorias', async ({ request }) => {
        const corpo = (await request.json()) as { descricao: string }
        enviados = [...enviados, corpo]
        return corpo.descricao === 'Mercado'
          ? HttpResponse.json({ status: 409, mensagem: 'Já existe uma categoria com essa descrição' }, { status: 409 })
          : HttpResponse.json({ id: 9, descricao: corpo.descricao, ativa: true }, { status: 201 })
      }),
    )
    const { usuario } = renderizar()
    await naLista('heading', { name: 'Ativas · 3' })

    await usuario.click(screen.getAllByRole('button', { name: 'Nova categoria' })[0])
    const dialogo = screen.getByRole('dialog', { name: 'Nova categoria' })
    await usuario.type(within(dialogo).getByLabelText(/Nome/), 'Mercado')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))
    expect(await within(dialogo).findByText('Já existe uma categoria com essa descrição')).toBeInTheDocument()

    await usuario.clear(within(dialogo).getByLabelText(/Nome/))
    await usuario.type(within(dialogo).getByLabelText(/Nome/), 'Assinaturas')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))

    expect(await screen.findByText('Categoria criada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(enviados).toEqual([{ descricao: 'Mercado' }, { descricao: 'Assinaturas' }])
  })

  it('renomeia e inativa pelo diálogo de edição', async () => {
    const chamadas: string[] = []
    server.use(
      http.put('*/api/categorias/:id', async ({ params, request }) => {
        chamadas.push(`PUT ${params.id} ${((await request.json()) as { descricao: string }).descricao}`)
        return HttpResponse.json({ id: 2, descricao: 'Feira', ativa: true })
      }),
      http.patch('*/api/categorias/:id/status', async ({ params, request }) => {
        chamadas.push(`PATCH ${params.id} ${((await request.json()) as { ativa: boolean }).ativa}`)
        return HttpResponse.json({ id: 2, descricao: 'Mercado', ativa: false })
      }),
    )
    const { usuario } = renderizar()

    await usuario.click(await naLista('button', { name: 'Editar categoria Mercado' }))
    let dialogo = screen.getByRole('dialog', { name: 'Editar categoria' })
    await usuario.clear(within(dialogo).getByLabelText(/Nome/))
    await usuario.type(within(dialogo).getByLabelText(/Nome/), 'Feira')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Categoria renomeada')).toBeInTheDocument()

    await usuario.click(cartoes().getByRole('button', { name: 'Editar categoria Mercado' }))
    dialogo = screen.getByRole('dialog', { name: 'Editar categoria' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Inativar categoria' }))
    expect(await screen.findByText('Categoria inativada')).toBeInTheDocument()

    expect(chamadas).toEqual(['PUT 2 Feira', 'PATCH 2 false'])
  })

  it('excluir uma categoria em uso (422) mostra o aviso e oferece inativar', async () => {
    server.use(
      http.delete('*/api/categorias/:id', () =>
        HttpResponse.json({ status: 422, mensagem: 'Categoria vinculada' }, { status: 422 }),
      ),
    )
    const { usuario } = renderizar()

    await usuario.click(await naLista('button', { name: 'Editar categoria Mercado' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar categoria' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir categoria' }))

    expect(await within(dialogo).findByText(/Não dá para excluir Mercado/)).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Inativar categoria' })).toBeInTheDocument()
  })

  it('exclui uma categoria sem lançamentos', async () => {
    server.use(http.delete('*/api/categorias/:id', () => new HttpResponse(null, { status: 204 })))
    const { usuario } = renderizar()

    await usuario.click(await naLista('button', { name: 'Editar categoria Aluguel' }))
    await usuario.click(screen.getByRole('button', { name: 'Excluir categoria' }))

    expect(await screen.findByText('Categoria excluída')).toBeInTheDocument()
  })

  it('reativa uma inativa; erro da API vira toast', async () => {
    let falhar = false
    server.use(
      http.patch('*/api/categorias/:id/status', () =>
        falhar
          ? HttpResponse.json({ status: 500, mensagem: 'Não foi possível salvar.' }, { status: 500 })
          : HttpResponse.json({ id: 4, descricao: 'Academia', ativa: true }),
      ),
    )
    const { usuario } = renderizar()

    await usuario.click(await naLista('button', { name: 'Reativar Academia' }))
    expect(await screen.findByText('Categoria reativada')).toBeInTheDocument()

    falhar = true
    await usuario.click(cartoes().getByRole('button', { name: 'Reativar Academia' }))
    // 5xx: a frase do front, nunca a mensagem da API
    expect(await screen.findByText('Não foi possível concluir a operação. Tente novamente.')).toBeInTheDocument()
  })

  it('outros erros ao salvar, inativar e excluir viram toast com a mensagem da API', async () => {
    const erro = () => HttpResponse.json({ status: 422, mensagem: 'Recusado pela API' }, { status: 422 })
    server.use(
      http.put('*/api/categorias/:id', erro),
      http.patch('*/api/categorias/:id/status', erro),
      // No DELETE o 422 é "em uso" (contrato): o erro genérico aqui é um 500, com a frase do front
      http.delete('*/api/categorias/:id', () =>
        HttpResponse.json({ status: 500, mensagem: 'NullPointerException' }, { status: 500 }),
      ),
    )
    const { usuario } = renderizar()

    await usuario.click(await naLista('button', { name: 'Editar categoria Mercado' }))
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findAllByText('Recusado pela API')).toHaveLength(1)
    await usuario.click(screen.getByRole('button', { name: 'Inativar categoria' }))
    await waitFor(() => expect(screen.getAllByText('Recusado pela API').length).toBeGreaterThanOrEqual(2))
    await usuario.click(screen.getByRole('button', { name: 'Excluir categoria' }))
    expect(
      (await screen.findAllByText('Não foi possível concluir a operação. Tente novamente.'))[0],
    ).toBeInTheDocument()
    expect(screen.queryByText('NullPointerException')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Editar categoria' })).toBeInTheDocument()
  })

  it('sem conexão: mostra o aviso e não abre o diálogo', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { usuario } = renderizar()
    await naLista('heading', { name: 'Ativas · 3' })

    expect(screen.getByText(/Sem internet agora/)).toBeInTheDocument()
    await usuario.click(screen.getAllByRole('button', { name: 'Nova categoria' })[0])
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('o esqueleto da rota e o erro fora do Provider', () => {
    renderComProviders(<CategoriasSkeleton />)
    expect(screen.getByLabelText('Carregando categorias')).toBeInTheDocument()

    function SemProvider() {
      useCategoriasContext()
      return null
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderComProviders(<SemProvider />)).toThrow(/dentro de <CategoriasProvider>/)
  })
})
