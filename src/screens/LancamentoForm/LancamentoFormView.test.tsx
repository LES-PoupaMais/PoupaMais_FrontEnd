import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/atoms/sonner'
import { TooltipProvider } from '@/components/atoms/tooltip'
import { lancamentosDemo, server } from '@/test/msw/server-e-dados'
import { renderComProviders } from '@/test/utils'
import type { Lancamento } from '@/types/api'
import { LancamentoFormProvider, useLancamentoFormContext } from './LancamentoFormContext'
import { LancamentoFormSkeleton } from './LancamentoFormSkeleton'
import { LancamentoFormView } from './LancamentoFormView'

const rota = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: rota.replace, push: rota.push }),
  usePathname: () => '/lancamentos/novo',
  useSearchParams: () => new URLSearchParams(),
}))

// O Radix (switch e tooltip) mede os elementos com ResizeObserver, que o jsdom não tem
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

// O toast (sonner) captura o ponteiro para arrastar; o jsdom não tem essas funções
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}

type Enviado = { metodo: string; caminho: string; corpo: unknown }
let enviados: Enviado[] = []

const lancamentoSalvo = (corpo: Record<string, unknown>, id = 50): Lancamento => ({
  ...(lancamentosDemo[0] as Lancamento),
  ...(corpo as Partial<Lancamento>),
  id,
  status: 'ATIVO',
})

const naLixeira: Lancamento = {
  ...(lancamentosDemo[2] as Lancamento),
  id: 9,
  status: 'DELETADO',
  dataExclusao: '2026-11-16T12:20:00Z',
}

beforeEach(() => {
  enviados = []
  rota.replace.mockClear()
  rota.push.mockClear()
  const registrar = async (request: Request) => {
    const texto = await request.text()
    const corpo = texto ? JSON.parse(texto) : null
    enviados.push({ metodo: request.method, caminho: new URL(request.url).pathname, corpo })
    return corpo
  }
  server.use(
    http.post('*/api/lancamentos', async ({ request }) =>
      HttpResponse.json(lancamentoSalvo(await registrar(request)), { status: 201 }),
    ),
    http.put('*/api/lancamentos/:id', async ({ request, params }) =>
      HttpResponse.json(lancamentoSalvo(await registrar(request), Number(params.id))),
    ),
    http.patch('*/api/lancamentos/:id/status', async ({ request, params }) => {
      const corpo = await registrar(request)
      return HttpResponse.json({ ...lancamentoSalvo({}, Number(params.id)), status: corpo.status })
    }),
    http.delete('*/api/lancamentos/:id', async ({ request }) => {
      await registrar(request)
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('*/api/categorias', async ({ request }) => {
      const { descricao } = await registrar(request)
      return descricao.toLowerCase() === 'mercado'
        ? HttpResponse.json({ status: 409, mensagem: 'Categoria duplicada' }, { status: 409 })
        : HttpResponse.json({ id: 77, descricao, ativa: true }, { status: 201 })
    }),
  )
})

afterEach(() => {
  act(() => toast.dismiss())
  vi.restoreAllMocks()
})

function renderizar(props: { modo: 'novo' } | { modo: 'editar'; id: number | null } = { modo: 'novo' }) {
  return renderComProviders(
    <TooltipProvider>
      {props.modo === 'novo' ? (
        <LancamentoFormProvider modo="novo">
          <LancamentoFormView />
        </LancamentoFormProvider>
      ) : (
        <LancamentoFormProvider modo="editar" id={props.id}>
          <LancamentoFormView />
        </LancamentoFormProvider>
      )}
      <Toaster />
    </TooltipProvider>,
  )
}

type Usuario = ReturnType<typeof renderizar>['usuario']

async function preencher(usuario: Usuario, { saldo = true } = {}) {
  await usuario.type(screen.getByLabelText(/^Descrição/), 'Mercado do mês')
  await usuario.click(screen.getByRole('radio', { name: 'Despesa' }))
  const data = screen.getByLabelText(/^Data/)
  await usuario.clear(data)
  await usuario.type(data, '05/11/2026')
  await usuario.type(screen.getByLabelText(/^Valor/), '1.120,35')
  await usuario.click(screen.getByRole('button', { name: 'Abrir lista de categorias' }))
  await usuario.click(await screen.findByRole('checkbox', { name: 'Mercado' }))
  await usuario.keyboard('{Escape}')
  if (!saldo) await usuario.click(screen.getByRole('switch', { name: 'Conta no saldo' }))
}

const botaoSalvar = () => screen.getByRole('button', { name: /Salvar lançamento|Salvando lançamento/ })

describe('Novo lançamento', () => {
  it('salva, mostra o toast e volta para a lista do mês do lançamento', async () => {
    const { usuario } = renderizar()
    expect(screen.getByRole('heading', { level: 1, name: 'Novo lançamento' })).toBeInTheDocument()

    await preencher(usuario)
    await usuario.click(botaoSalvar())

    expect(await screen.findByText('Lançamento salvo')).toBeInTheDocument()
    expect(rota.replace).toHaveBeenCalledWith('/lancamentos?mes=11&ano=2026')
    expect(enviados).toEqual([
      {
        metodo: 'POST',
        caminho: '/api/lancamentos',
        corpo: { descricao: 'Mercado do mês', tipo: 'DESPESA', data: '2026-11-05', valor: 1120.35, categoriaIds: [2] },
      },
    ])
  })

  it('"Conta no saldo" desligado: depois de criar, manda o PATCH de status INATIVO', async () => {
    const { usuario } = renderizar()
    await preencher(usuario, { saldo: false })
    await usuario.click(botaoSalvar())

    await waitFor(() => expect(rota.replace).toHaveBeenCalled())
    expect(enviados.map((e) => `${e.metodo} ${e.caminho}`)).toEqual([
      'POST /api/lancamentos',
      'PATCH /api/lancamentos/50/status',
    ])
    expect(enviados[1].corpo).toEqual({ status: 'INATIVO' })
  })

  it('sem resposta da API: o formulário continua preenchido e o toast oferece tentar de novo', async () => {
    let tentativas = 0
    server.use(
      http.post('*/api/lancamentos', async ({ request }) => {
        tentativas += 1
        if (tentativas === 1) return HttpResponse.error()
        return HttpResponse.json(lancamentoSalvo((await request.json()) as Record<string, unknown>), { status: 201 })
      }),
    )
    const { usuario } = renderizar()
    await preencher(usuario)
    await usuario.click(botaoSalvar())

    expect(await screen.findByText('Não foi possível salvar. O que você preencheu continua aqui.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Descrição/)).toHaveValue('Mercado do mês')
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() => expect(rota.replace).toHaveBeenCalledWith('/lancamentos?mes=11&ano=2026'))
  })

  it('erros[] da API aparecem nos campos', async () => {
    server.use(
      http.post('*/api/lancamentos', () =>
        HttpResponse.json(
          {
            status: 400,
            mensagem: 'Dados inválidos',
            erros: [{ campo: 'data', mensagem: 'Informe uma data que exista.' }],
          },
          { status: 400 },
        ),
      ),
    )
    const { usuario } = renderizar()
    await preencher(usuario)
    await usuario.click(botaoSalvar())

    expect(await screen.findByText('Confira os campos marcados.')).toBeInTheDocument()
    expect(screen.getByText('Informe uma data que exista.')).toBeInTheDocument()
    expect(rota.replace).not.toHaveBeenCalled()
  })

  it.each([
    [422, 'Uma das categorias escolhidas está inativa. Escolha outra.'],
    [404, 'Uma das categorias escolhidas não existe mais. Escolha outra.'],
  ])('%i no envio vira uma mensagem clara', async (status, mensagem) => {
    server.use(http.post('*/api/lancamentos', () => HttpResponse.json({ status, mensagem: 'cru' }, { status })))
    const { usuario } = renderizar()
    await preencher(usuario)
    await usuario.click(botaoSalvar())

    expect(await screen.findByText(mensagem)).toBeInTheDocument()
    expect(screen.queryByText('cru')).toBeNull()
  })

  it('cria a categoria pelo campo (409 no diálogo) e ela já entra escolhida', async () => {
    const { usuario } = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Abrir lista de categorias' }))
    await usuario.type(await screen.findByRole('searchbox', { name: 'Buscar categoria' }), 'mercado')
    await usuario.click(screen.getByRole('button', { name: 'Criar "mercado"' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Nova categoria' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))
    expect(await within(dialogo).findByText('Já existe uma categoria com esse nome')).toBeInTheDocument()

    const campo = within(dialogo).getByLabelText(/Nome da categoria/)
    await usuario.clear(campo)
    await usuario.type(campo, 'Farmácia')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))

    expect(await screen.findByText('Categoria "Farmácia" criada')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Nova categoria' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remover Farmácia' })).toBeInTheDocument()
  })

  it('falha ao criar a categoria: toast; Cancelar fecha o diálogo', async () => {
    server.use(http.post('*/api/categorias', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })))
    const { usuario } = renderizar()
    await usuario.click(screen.getByRole('button', { name: 'Abrir lista de categorias' }))
    await usuario.click(await screen.findByRole('button', { name: 'Criar nova categoria' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Nova categoria' })
    await usuario.type(within(dialogo).getByLabelText(/Nome da categoria/), 'Pets')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Criar categoria' }))

    expect(await screen.findByText('Não foi possível criar a categoria. Tente de novo.')).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova categoria' })).toBeNull())
  })

  it('erro ao carregar as categorias: aviso com Tentar de novo', async () => {
    let falhar = true
    server.use(
      http.get('*/api/categorias', () =>
        falhar
          ? HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })
          : HttpResponse.json([{ id: 1, descricao: 'Aluguel', ativa: true, quantidadeLancamentos: 0 }]),
      ),
    )
    const { usuario } = renderizar()

    expect(await screen.findByText('Não foi possível carregar as categorias.')).toBeInTheDocument()
    falhar = false
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() => expect(screen.queryByText('Não foi possível carregar as categorias.')).toBeNull())
  })

  it('sem conexão: aviso e Salvar desabilitado com o motivo', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { usuario } = renderizar()

    expect(
      screen.getByText('Sem internet agora. Você pode continuar vendo, mas não dá para salvar.'),
    ).toBeInTheDocument()
    expect(botaoSalvar()).toHaveAttribute('aria-disabled', 'true')
    expect(botaoSalvar()).toHaveAccessibleDescription(/Sem internet/)
    await preencher(usuario)
    await usuario.click(botaoSalvar())
    expect(enviados).toHaveLength(0)
  })

  it('Limpar pergunta antes de descartar o que foi preenchido', async () => {
    const { usuario } = renderizar()
    const [limparCelular] = screen.getAllByRole('button', { name: 'Limpar' })
    expect(limparCelular).toBeDisabled()

    await usuario.type(screen.getByLabelText(/^Descrição/), 'Padaria')
    await usuario.click(limparCelular)
    const dialogo = await screen.findByRole('alertdialog', { name: 'Descartar alterações?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByLabelText(/^Descrição/)).toHaveValue('Padaria')

    await usuario.click(limparCelular)
    await usuario.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Descartar' }))
    await waitFor(() => expect(screen.getByLabelText(/^Descrição/)).toHaveValue(''))
  })

  it('link com alterações não salvas: pergunta e só navega ao descartar', async () => {
    const { usuario } = renderizar()
    await usuario.type(screen.getByLabelText(/^Descrição/), 'Padaria')

    await usuario.click(screen.getByRole('link', { name: 'Cancelar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Descartar alterações?' })
    expect(rota.push).not.toHaveBeenCalled()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Descartar' }))
    expect(rota.push).toHaveBeenCalledWith('/lancamentos')
  })

  it('Voltar do navegador com alterações: pergunta; Cancelar fica, Descartar volta', async () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { usuario } = renderizar()
    await usuario.type(screen.getByLabelText(/^Descrição/), 'Padaria')
    expect(pushState).toHaveBeenCalledTimes(1)

    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    let dialogo = await screen.findByRole('alertdialog', { name: 'Descartar alterações?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(pushState).toHaveBeenCalledTimes(2)

    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    dialogo = await screen.findByRole('alertdialog', { name: 'Descartar alterações?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Descartar' }))
    expect(back).toHaveBeenCalledTimes(1)
    pushState.mockRestore()
    back.mockRestore()
  })
})

describe('Editar lançamento', () => {
  it('carrega o lançamento e salva com PUT', async () => {
    const { usuario } = renderizar({ modo: 'editar', id: 3 })

    expect(screen.getByLabelText('Carregando o formulário')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Mercado do mês')).toBeInTheDocument()
    expect(screen.getByText('Mercado do mês · 5 de novembro de 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover Mercado' })).toBeInTheDocument()

    const valor = screen.getByLabelText(/^Valor/)
    await usuario.clear(valor)
    await usuario.type(valor, '1.200')
    await usuario.click(botaoSalvar())

    await waitFor(() => expect(rota.replace).toHaveBeenCalledWith('/lancamentos?mes=11&ano=2026'))
    expect(enviados).toEqual([
      {
        metodo: 'PUT',
        caminho: '/api/lancamentos/3',
        corpo: { descricao: 'Mercado do mês', tipo: 'DESPESA', data: '2026-11-05', valor: 1200, categoriaIds: [2] },
      },
    ])
  })

  it('não encontrado (404 ou endereço sem número)', async () => {
    renderizar({ modo: 'editar', id: 999 })
    expect(await screen.findByText('Lançamento não encontrado')).toBeInTheDocument()
  })

  it('id inválido vai direto para não encontrado', () => {
    renderizar({ modo: 'editar', id: null })
    expect(screen.getByText('Lançamento não encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Lançamentos' })).toHaveAttribute('href', '/lancamentos')
  })

  it('erro ao carregar: Tentar de novo', async () => {
    let falhar = true
    server.use(
      http.get('*/api/lancamentos/:id', () =>
        falhar
          ? HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })
          : HttpResponse.json(lancamentosDemo.find((l) => l.id === 3)),
      ),
    )
    const { usuario } = renderizar({ modo: 'editar', id: 3 })

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()
    falhar = false
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByDisplayValue('Mercado do mês')).toBeInTheDocument()
  })

  it('Mover para a lixeira: toast com Desfazer; o DELETE só sai quando o toast fecha', async () => {
    const { usuario } = renderizar({ modo: 'editar', id: 3 })
    await screen.findByDisplayValue('Mercado do mês')

    const [botaoCelular] = screen.getAllByRole('button', { name: 'Mover para a lixeira' })
    await usuario.click(botaoCelular)
    expect(await screen.findByText('Movido para a lixeira')).toBeInTheDocument()
    // Mesmo toast da lista (UndoToast): contador e barra de tempo
    expect(screen.getByText('5 s')).toBeInTheDocument()
    expect(rota.replace).toHaveBeenCalledWith('/lancamentos?mes=11&ano=2026')
    expect(enviados).toHaveLength(0)

    // Desfazer: nada é enviado
    await usuario.click(screen.getByRole('button', { name: 'Desfazer' }))
    act(() => toast.dismiss())
    await new Promise((r) => setTimeout(r, 50))
    expect(enviados).toHaveLength(0)

    // Sem Desfazer: ao fechar, envia
    await usuario.click(screen.getAllByRole('button', { name: 'Mover para a lixeira' })[0])
    await screen.findByText('Movido para a lixeira')
    act(() => toast.dismiss())
    await waitFor(() => expect(enviados).toEqual([{ metodo: 'DELETE', caminho: '/api/lancamentos/3', corpo: null }]))
  })

  it('na lixeira: mostra o aviso e Restaurar', async () => {
    let atual = naLixeira
    server.use(
      http.get('*/api/lancamentos/:id', () => HttpResponse.json(atual)),
      http.post('*/api/lancamentos/:id/restaurar', () => {
        atual = { ...naLixeira, status: 'INATIVO', dataExclusao: null }
        return HttpResponse.json(atual)
      }),
    )
    const { usuario } = renderizar({ modo: 'editar', id: 9 })

    expect(await screen.findByText(/Este lançamento está na lixeira/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lixeira' })).toHaveAttribute('href', '/lancamentos/lixeira')
    // Mesma visualização da Lixeira (TransactionDetail): selo, "Conta no saldo" sem switch e "Ver a lixeira"
    expect(screen.getByText('Não · volta desligado ao restaurar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver a lixeira' })).toHaveAttribute('href', '/lancamentos/lixeira')
    await usuario.click(screen.getByRole('button', { name: 'Restaurar' }))

    expect(await screen.findByText('Restaurado como inativo. Ative para voltar ao dashboard.')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Mercado do mês')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Conta no saldo' })).toHaveAttribute('aria-checked', 'false')
  })

  it('falha ao restaurar: toast de erro', async () => {
    server.use(
      http.get('*/api/lancamentos/:id', () => HttpResponse.json(naLixeira)),
      http.post('*/api/lancamentos/:id/restaurar', () =>
        HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }),
      ),
    )
    const { usuario } = renderizar({ modo: 'editar', id: 9 })
    await usuario.click(await screen.findByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText('Não foi possível restaurar. Tente de novo.')).toBeInTheDocument()
  })
})

describe('LancamentoForm (Context e Skeleton)', () => {
  it('useLancamentoFormContext fora do Provider dá erro claro', () => {
    function Solto() {
      useLancamentoFormContext()
      return null
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderComProviders(<Solto />)).toThrow(
      'useLancamentoFormContext precisa estar dentro de <LancamentoFormProvider>',
    )
  })

  it('o Skeleton marca o carregamento', () => {
    renderComProviders(<LancamentoFormSkeleton titulo="Editar lançamento" />)
    expect(screen.getByLabelText('Carregando o formulário')).toHaveAttribute('aria-busy', 'true')
  })
})
