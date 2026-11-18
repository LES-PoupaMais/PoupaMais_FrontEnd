// Tipos que espelham os DTOs da API v1.1.0 (seção "Contrato da API" do CLAUDE.md). JSON em camelCase.
// Datas: `DataIso` = "2026-11-05" (dia do lançamento, sem hora); `InstanteIso` = "2026-08-03T09:30:15Z" (auditoria, UTC).

export type DataIso = string
export type InstanteIso = string

export type TipoLancamento = 'RECEITA' | 'DESPESA'
export type StatusLancamento = 'ATIVO' | 'INATIVO' | 'DELETADO'
export type ClassificacaoTaxa = 'DENTRO_DO_LIMITE' | 'ATENCAO' | 'ACIMA_DO_LIMITE'

/** Página de resultados: `pagina` começa em 0; `tamanho` de 1 a 100 (padrão 12). */
export type Pagina<T> = {
  itens: T[]
  pagina: number
  tamanho: number
  total: number
  totalPaginas: number
}

// ---------- erro padrão ----------
export type ErroCampoApi = { campo: string; mensagem: string }
export type RespostaErro = { status: number; mensagem: string; erros?: ErroCampoApi[] }

// ---------- auth e usuário ----------
export type LoginRequest = { email: string; senha: string }
export type CadastroRequest = { nome: string; email: string; senha: string; aceiteTermos: boolean }
export type UsuarioResumo = { id: number; nome: string; email: string }
export type LoginResponse = { token: string; expiraEm: InstanteIso; usuario: UsuarioResumo }
export type TokenResponse = { token: string; expiraEm: InstanteIso }

export type Usuario = UsuarioResumo & {
  possuiFoto: boolean
  /** Dia do cadastro ("2026-11-01") */
  dataCadastro: DataIso
}
export type AtualizarUsuarioRequest = { nome: string }
export type AlterarSenhaRequest = { senhaAtual: string; novaSenha: string }
export type ExcluirContaRequest = { senha: string }

// ---------- categorias ----------
export type CategoriaResumo = { id: number; descricao: string }

/** `POST`/`PUT`/`PATCH` devolvem a categoria sem a contagem. */
export type Categoria = CategoriaResumo & { ativa: boolean }

/** `GET /categorias?mes&ano`: ATIVO + INATIVO do mês (DELETADO não conta); sem mês/ano, o mês atual. */
export type CategoriaComContagem = Categoria & { quantidadeLancamentos: number }

export type FiltrosCategorias = { ativa?: boolean; mes?: number; ano?: number }
export type CategoriaRequest = { descricao: string }

// ---------- lançamentos ----------
export type Lancamento = {
  id: number
  descricao: string
  tipo: TipoLancamento
  data: DataIso
  valor: number
  status: StatusLancamento
  categorias: CategoriaResumo[]
  dataCadastro: InstanteIso
  dataAtualizacao: InstanteIso
  /** Preenchida ao ir para a lixeira; `null` ao restaurar */
  dataExclusao: InstanteIso | null
}

export type LancamentoRequest = {
  descricao: string
  tipo: TipoLancamento
  data: DataIso
  valor: number
  categoriaIds: number[]
}

/** Filtros da lista (e da exportação, que ignora a paginação). Sem `status` = ATIVO + INATIVO; `DELETADO` = Lixeira. */
export type FiltrosLancamentos = {
  descricao?: string
  mes?: number
  ano?: number
  tipo?: TipoLancamento
  status?: StatusLancamento
  categoriaId?: number
}

export type FalhaImportacao = { linha: number; conteudo: string; motivo: string }
export type ResultadoImportacao = {
  totalLinhas: number
  importados: number
  falhas: FalhaImportacao[]
  categoriasCriadas: string[]
}

export type FormatoExportacao = 'csv' | 'xlsx'

// ---------- dashboard ----------
export type ResumoMes = { mes: number; ano: number; receitas: number; despesas: number; saldo: number }
export type DespesaPorCategoria = { categoriaId: number; descricao: string; valor: number }
export type MaiorDespesa = { id: number; descricao: string; valor: number; categorias: string[] }

export type Dashboard = {
  mes: number
  ano: number
  receitas: number
  despesas: number
  saldo: number
  /** `null` sem receitas: "Não disponível para o período" */
  taxaGasto: number | null
  classificacaoTaxa: ClassificacaoTaxa | null
  mensagem: string
  /** 4 meses, do mais antigo ao mês pedido */
  ultimosMeses: ResumoMes[]
  despesasPorCategoria: DespesaPorCategoria[]
  maioresDespesas: MaiorDespesa[]
  /** Soma das 5 maiores e % sobre as despesas do mês (2 casas); `percentual` `null` sem despesa */
  pesoMaioresDespesas: { valor: number; percentual: number | null }
}

/** Mês do filtro (Dashboard e Lançamentos), sempre na URL: `?mes=11&ano=2026` */
export type MesAno = { mes: number; ano: number }
