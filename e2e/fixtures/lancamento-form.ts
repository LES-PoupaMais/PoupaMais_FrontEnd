import type { Page, Route } from '@playwright/test'

// API simulada do formulário de lançamento (Novo/Editar): categorias com criar (409 em duplicada), lançamento por id,
// POST/PUT (com o status de "Conta no saldo" no corpo, v1.2.0), PATCH de status e restaurar. Guarda o que foi enviado para o teste conferir.
export type Enviado = { metodo: string; caminho: string; corpo: unknown }

type Categoria = { id: number; descricao: string; ativa: boolean; quantidadeLancamentos: number }

export const lancamentoEditavel = {
  id: 3,
  descricao: 'Mercado do mês',
  tipo: 'DESPESA',
  data: '2026-11-05',
  valor: 1120.35,
  status: 'ATIVO',
  categorias: [{ id: 2, descricao: 'Mercado' }],
  dataCadastro: '2026-11-05T22:42:00Z',
  dataAtualizacao: '2026-11-05T22:42:00Z',
  dataExclusao: null as string | null,
}

export const lancamentoNaLixeira = {
  ...lancamentoEditavel,
  id: 9,
  descricao: 'Lanche',
  data: '2026-11-14',
  valor: 32.5,
  status: 'DELETADO',
  categorias: [{ id: 5, descricao: 'Restaurantes' }],
  dataCadastro: '2026-11-14T16:05:00Z',
  dataExclusao: '2026-11-16T12:20:00Z',
}

export async function simularApiDoFormulario(page: Page): Promise<Enviado[]> {
  const enviados: Enviado[] = []
  const categorias: Categoria[] = [
    { id: 1, descricao: 'Aluguel', ativa: true, quantidadeLancamentos: 1 },
    { id: 2, descricao: 'Mercado', ativa: true, quantidadeLancamentos: 2 },
    { id: 5, descricao: 'Restaurantes', ativa: true, quantidadeLancamentos: 0 },
    { id: 4, descricao: 'Academia', ativa: false, quantidadeLancamentos: 0 },
  ]
  const lancamentos = new Map<number, Record<string, unknown>>([
    [lancamentoEditavel.id, { ...lancamentoEditavel }],
    [lancamentoNaLixeira.id, { ...lancamentoNaLixeira }],
  ])
  let proximoId = 100

  const registrar = (rota: Route) => {
    const req = rota.request()
    const corpo = req.postData() ? JSON.parse(req.postData() as string) : null
    enviados.push({ metodo: req.method(), caminho: new URL(req.url()).pathname, corpo })
    return corpo
  }

  await page.route('**/api/usuarios/me', (rota) =>
    rota.fulfill({
      json: {
        id: 1,
        nome: 'Usuário Demo',
        email: 'demo@poupamais.com.br',
        possuiFoto: false,
        dataCadastro: '2026-08-01',
      },
    }),
  )
  await page.route('**/api/categorias', async (rota) => {
    if (rota.request().method() === 'GET') return rota.fulfill({ json: categorias })
    const { descricao } = registrar(rota) as { descricao: string }
    if (categorias.some((c) => c.descricao.toLowerCase() === descricao.toLowerCase())) {
      return rota.fulfill({
        status: 409,
        json: { status: 409, codigo: 'CATEGORIA_DUPLICADA', mensagem: 'Já existe uma categoria com essa descrição' },
      })
    }
    const nova = { id: proximoId++, descricao, ativa: true, quantidadeLancamentos: 0 }
    categorias.push(nova)
    return rota.fulfill({ status: 201, json: { id: nova.id, descricao, ativa: true } })
  })
  await page.route('**/api/lancamentos?*', (rota) =>
    rota.fulfill({ json: { itens: [], pagina: 0, tamanho: 12, total: 0, totalPaginas: 0 } }),
  )
  await page.route('**/api/lancamentos', async (rota) => {
    if (rota.request().method() !== 'POST')
      return rota.fulfill({ json: { itens: [], pagina: 0, tamanho: 12, total: 0, totalPaginas: 0 } })
    const corpo = registrar(rota) as { categoriaIds: number[] } & Record<string, unknown>
    // Contrato v1.2.0: o status vem no corpo (padrão ATIVO)
    const novo = {
      ...corpo,
      id: proximoId++,
      status: corpo.status ?? 'ATIVO',
      categorias: corpo.categoriaIds.map((id) => categorias.find((c) => c.id === id)),
      dataCadastro: '2026-11-18T12:00:00Z',
      dataAtualizacao: null, // v1.2.0: nasce sem alteração
      dataExclusao: null,
    }
    lancamentos.set(novo.id, novo)
    return rota.fulfill({ status: 201, json: novo })
  })
  await page.route(/\/api\/lancamentos\/\d+(\/status|\/restaurar)?$/, async (rota) => {
    const req = rota.request()
    const [, id, acao] = /\/lancamentos\/(\d+)(\/\w+)?$/.exec(new URL(req.url()).pathname) ?? []
    const atual = lancamentos.get(Number(id))
    if (!atual)
      return rota.fulfill({
        status: 404,
        json: { status: 404, codigo: 'LANCAMENTO_NAO_ENCONTRADO', mensagem: 'Lançamento não encontrado' },
      })
    if (req.method() === 'GET') return rota.fulfill({ json: atual })
    const corpo = registrar(rota) as Record<string, unknown> | null
    // Regras da API v1.2.0 para o item da lixeira
    if (atual.status === 'DELETADO' && (acao === '/status' || req.method() === 'PUT'))
      return rota.fulfill({
        status: 422,
        json: { status: 422, codigo: 'LANCAMENTO_NA_LIXEIRA', mensagem: 'Lançamento excluído' },
      })
    if (acao === '/restaurar' && atual.status !== 'DELETADO')
      return rota.fulfill({
        status: 422,
        json: {
          status: 422,
          codigo: 'LANCAMENTO_NAO_EXCLUIDO',
          mensagem: 'Só é possível restaurar um lançamento excluído',
        },
      })
    if (corpo?.status === 'DELETADO')
      return rota.fulfill({
        status: 400,
        json: {
          status: 400,
          codigo: 'VALIDACAO',
          mensagem: 'Dados inválidos',
          erros: [{ campo: 'status', mensagem: 'Informe o status ATIVO ou INATIVO' }],
        },
      })
    let novo = atual
    if (acao === '/status') novo = { ...atual, status: corpo?.status }
    else if (acao === '/restaurar')
      // v1.2.0: volta ao status de antes da lixeira (sem esse dado, INATIVO)
      novo = { ...atual, status: atual.statusAnterior ?? 'INATIVO', statusAnterior: undefined, dataExclusao: null }
    else if (req.method() === 'PUT') novo = { ...atual, ...corpo, status: corpo?.status ?? atual.status }
    else if (req.method() === 'DELETE') novo = { ...atual, status: 'DELETADO', statusAnterior: atual.status }
    lancamentos.set(Number(id), novo)
    return rota.fulfill({ json: novo })
  })
  return enviados
}
