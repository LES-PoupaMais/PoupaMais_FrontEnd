import type { CategoriaComContagem, Dashboard, Lancamento, Pagina, Usuario } from '@/types/api'

// Dados de exemplo dos testes (os mesmos números das pranchetas: Novembro 2026).
export const usuarioDemo: Usuario = {
  id: 1,
  nome: 'Usuário Demo',
  email: 'demo@poupamais.com.br',
  possuiFoto: false,
  dataCadastro: '2026-08-01',
}

export const categoriasDemo: CategoriaComContagem[] = [
  { id: 1, descricao: 'Aluguel', ativa: true, quantidadeLancamentos: 1 },
  { id: 2, descricao: 'Mercado', ativa: true, quantidadeLancamentos: 2 },
  { id: 3, descricao: 'Trabalho', ativa: true, quantidadeLancamentos: 2 },
  { id: 4, descricao: 'Academia', ativa: false, quantidadeLancamentos: 0 },
]

function lancamento(parcial: Partial<Lancamento> & Pick<Lancamento, 'id' | 'descricao' | 'tipo' | 'data' | 'valor'>) {
  return {
    status: 'ATIVO',
    categorias: [],
    dataCadastro: `${parcial.data}T22:42:00Z`,
    dataAtualizacao: `${parcial.data}T22:42:00Z`,
    dataExclusao: null,
    ...parcial,
  } satisfies Lancamento
}

export const lancamentosDemo: Lancamento[] = [
  lancamento({
    id: 5,
    descricao: 'Feira e padaria',
    tipo: 'DESPESA',
    data: '2026-11-18',
    valor: 360,
    categorias: [{ id: 2, descricao: 'Mercado' }],
  }),
  lancamento({
    id: 4,
    descricao: 'Freelance de design',
    tipo: 'RECEITA',
    data: '2026-11-15',
    valor: 2180.5,
    categorias: [{ id: 3, descricao: 'Trabalho' }],
  }),
  lancamento({
    id: 3,
    descricao: 'Mercado do mês',
    tipo: 'DESPESA',
    data: '2026-11-05',
    valor: 1120.35,
    categorias: [{ id: 2, descricao: 'Mercado' }],
  }),
  lancamento({
    id: 2,
    descricao: 'Salário',
    tipo: 'RECEITA',
    data: '2026-11-05',
    valor: 9800,
    categorias: [{ id: 3, descricao: 'Trabalho' }],
  }),
  lancamento({
    id: 1,
    descricao: 'Aluguel do apartamento',
    tipo: 'DESPESA',
    data: '2026-11-01',
    valor: 2200,
    categorias: [{ id: 1, descricao: 'Aluguel' }],
  }),
]

/** Monta a página como a API: `pagina` desde 0, `tamanho` padrão 12 */
export function paginar<T>(itens: T[], pagina = 0, tamanho = 12): Pagina<T> {
  return {
    itens: itens.slice(pagina * tamanho, (pagina + 1) * tamanho),
    pagina,
    tamanho,
    total: itens.length,
    totalPaginas: Math.ceil(itens.length / tamanho),
  }
}

export const dashboardDemo: Dashboard = {
  mes: 11,
  ano: 2026,
  receitas: 12480.5,
  despesas: 7560.5,
  saldo: 4920,
  taxaGasto: 60.58,
  classificacaoTaxa: 'DENTRO_DO_LIMITE',
  mensagem: 'Você fechou o mês com R$ 4.920,00 positivos.',
  ultimosMeses: [
    { mes: 8, ano: 2026, receitas: 11900, despesas: 8320.4, saldo: 3579.6 },
    { mes: 9, ano: 2026, receitas: 12050, despesas: 9870.15, saldo: 2179.85 },
    { mes: 10, ano: 2026, receitas: 12300, despesas: 7940.8, saldo: 4359.2 },
    { mes: 11, ano: 2026, receitas: 12480.5, despesas: 7560.5, saldo: 4920 },
  ],
  despesasPorCategoria: [
    { categoriaId: 1, descricao: 'Aluguel', valor: 2200 },
    { categoriaId: 2, descricao: 'Mercado', valor: 1480.35 },
  ],
  maioresDespesas: [
    { id: 1, descricao: 'Aluguel do apartamento', data: '2026-11-01', valor: 2200, categorias: ['Aluguel'] },
    { id: 3, descricao: 'Mercado do mês', data: '2026-11-05', valor: 1120.35, categorias: ['Mercado'] },
  ],
  pesoMaioresDespesas: { valor: 4893.95, percentual: 64.73 },
}
