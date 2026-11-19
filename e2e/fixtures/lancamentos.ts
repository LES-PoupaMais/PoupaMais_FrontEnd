import type { Page, Route } from '@playwright/test'

// API de lançamentos simulada no navegador (lista com filtros e paginação, status, lixeira, restaurar, exportar),
// com estado em memória: o que uma ação muda aparece na próxima leitura, como na API real.
export type LancamentoFalso = {
  id: number
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  data: string
  valor: number
  status: 'ATIVO' | 'INATIVO' | 'DELETADO'
  categorias: { id: number; descricao: string }[]
  dataCadastro: string
  dataAtualizacao: string
  dataExclusao: string | null
}

export const categoriasFalsas = [
  { id: 1, descricao: 'Aluguel', ativa: true, quantidadeLancamentos: 1 },
  { id: 2, descricao: 'Mercado', ativa: true, quantidadeLancamentos: 9 },
  { id: 3, descricao: 'Trabalho', ativa: true, quantidadeLancamentos: 2 },
]
const [aluguel, mercado, trabalho] = categoriasFalsas.map(({ id, descricao }) => ({ id, descricao }))

function novo(
  id: number,
  descricao: string,
  tipo: LancamentoFalso['tipo'],
  data: string,
  valor: number,
  categoria = mercado,
) {
  return {
    id,
    descricao,
    tipo,
    data,
    valor,
    status: 'ATIVO',
    categorias: [categoria],
    dataCadastro: `${data}T22:42:00Z`,
    dataAtualizacao: `${data}T22:42:00Z`,
    dataExclusao: null,
  } satisfies LancamentoFalso
}

/** 15 lançamentos em novembro de 2026 (12 na primeira página) e 1 na lixeira */
export function lancamentosIniciais(): LancamentoFalso[] {
  const feiras = Array.from({ length: 12 }, (_, i) =>
    novo(100 + i, `Feira ${i + 1}`, 'DESPESA', `2026-11-${String(28 - i).padStart(2, '0')}`, 50 + i),
  )
  return [
    ...feiras,
    novo(3, 'Mercado do mês', 'DESPESA', '2026-11-05', 1120.35),
    novo(2, 'Salário', 'RECEITA', '2026-11-05', 9800, trabalho),
    novo(1, 'Aluguel do apartamento', 'DESPESA', '2026-11-01', 2200, aluguel),
    {
      ...novo(50, 'Academia', 'DESPESA', '2026-09-03', 119),
      status: 'DELETADO',
      dataExclusao: '2026-11-16T12:20:00Z',
    },
  ]
}

export type ApiFalsa = {
  lancamentos: LancamentoFalso[]
  excluidos: number[]
  statusAlterados: { id: number; status: string }[]
  exportacoes: URLSearchParams[]
}

const json = (rota: Route, corpo: unknown, status = 200) => rota.fulfill({ status, json: corpo })

export async function simularApiDeLancamentos(page: Page): Promise<ApiFalsa> {
  const api: ApiFalsa = { lancamentos: lancamentosIniciais(), excluidos: [], statusAlterados: [], exportacoes: [] }

  await page.route('**/api/categorias**', (rota) => json(rota, categoriasFalsas))

  await page.route('**/api/lancamentos**', async (rota) => {
    const pedido = rota.request()
    const url = new URL(pedido.url())
    const metodo = pedido.method()
    const partes = url.pathname
      .replace(/^\/api\/lancamentos\/?/, '')
      .split('/')
      .filter(Boolean)

    if (partes[0] === 'exportar') {
      api.exportacoes.push(url.searchParams)
      const formato = url.searchParams.get('formato') ?? 'csv'
      return rota.fulfill({
        status: 200,
        body: 'descricao;tipo;data;valor;categorias;status\n',
        headers: {
          'Content-Type': formato === 'csv' ? 'text/csv' : 'application/octet-stream',
          'Content-Disposition': `attachment; filename="lancamentos-novembro-2026.${formato}"`,
        },
      })
    }
    if (partes[0] === 'template-csv') {
      return rota.fulfill({
        body: 'descricao;tipo;data;valor;categorias\n',
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="modelo.csv"' },
      })
    }

    if (partes.length === 0 && metodo === 'GET') {
      const p = url.searchParams
      const status = p.get('status')
      const filtrados = api.lancamentos
        .filter((l) => (status ? l.status === status : l.status !== 'DELETADO'))
        .filter((l) => status === 'DELETADO' || !p.get('mes') || Number(l.data.slice(5, 7)) === Number(p.get('mes')))
        .filter((l) => !p.get('tipo') || l.tipo === p.get('tipo'))
        .filter((l) => !p.get('categoriaId') || l.categorias.some((c) => c.id === Number(p.get('categoriaId'))))
        .filter((l) => !p.get('descricao') || l.descricao.toLowerCase().includes(p.get('descricao')!.toLowerCase()))
      const pagina = Number(p.get('pagina') ?? 0)
      const tamanho = Number(p.get('tamanho') ?? 12)
      return json(rota, {
        itens: filtrados.slice(pagina * tamanho, (pagina + 1) * tamanho),
        pagina,
        tamanho,
        total: filtrados.length,
        totalPaginas: Math.ceil(filtrados.length / tamanho),
      })
    }

    const id = Number(partes[0])
    const lancamento = api.lancamentos.find((l) => l.id === id)
    if (!lancamento) return json(rota, { status: 404, mensagem: 'Lançamento não encontrado' }, 404)

    if (partes[1] === 'status' && metodo === 'PATCH') {
      const { status } = pedido.postDataJSON() as { status: LancamentoFalso['status'] }
      api.statusAlterados.push({ id, status })
      lancamento.status = status
      return json(rota, lancamento)
    }
    if (partes[1] === 'restaurar' && metodo === 'POST') {
      lancamento.status = 'INATIVO'
      lancamento.dataExclusao = null
      return json(rota, lancamento)
    }
    if (metodo === 'DELETE') {
      api.excluidos.push(id)
      lancamento.status = 'DELETADO'
      lancamento.dataExclusao = new Date().toISOString()
      return rota.fulfill({ status: 204 })
    }
    return json(rota, lancamento)
  })

  return api
}
