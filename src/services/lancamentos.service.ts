import { http, type ArquivoBaixado } from '@/lib/http'
import type {
  FiltrosLancamentos,
  FormatoExportacao,
  Lancamento,
  LancamentoRequest,
  Pagina,
  ResultadoImportacao,
  StatusLancamento,
} from '@/types/api'

// Lançamentos via BFF (/api/lancamentos/*). Funções puras, sem React: quem guarda cache são os hooks.

/** Tamanho padrão da página (o mesmo da API) e o máximo aceito */
export const TAMANHO_PAGINA = 12
export const TAMANHO_PAGINA_MAXIMO = 100

export type ParametrosListagem = FiltrosLancamentos & { pagina?: number; tamanho?: number }

export const lancamentosService = {
  /** Página ordenada por data desc, id desc. Sem `status` = ATIVO + INATIVO; `status=DELETADO` = Lixeira. */
  listar: ({ pagina = 0, tamanho = TAMANHO_PAGINA, ...filtros }: ParametrosListagem = {}) =>
    http.get<Pagina<Lancamento>>('/lancamentos', { params: { ...filtros, pagina, tamanho } }),

  buscar: (id: number) => http.get<Lancamento>(`/lancamentos/${id}`),

  criar: (dados: LancamentoRequest) => http.post<Lancamento>('/lancamentos', { corpo: dados }),

  atualizar: (id: number, dados: LancamentoRequest) => http.put<Lancamento>(`/lancamentos/${id}`, { corpo: dados }),

  /** "Conta no saldo": ATIVO ⇄ INATIVO (`422` se estiver na lixeira) */
  alterarStatus: (id: number, status: Exclude<StatusLancamento, 'DELETADO'>) =>
    http.patch<Lancamento>(`/lancamentos/${id}/status`, { corpo: { status } }),

  /** Mover para a lixeira (status DELETADO; a API guarda o status anterior) */
  moverParaLixeira: (id: number) => http.delete<void>(`/lancamentos/${id}`),

  /** Restaurar da lixeira: volta ao status anterior (itens antigos sem esse dado voltam INATIVO) */
  restaurar: (id: number) => http.post<Lancamento>(`/lancamentos/${id}/restaurar`),

  /** CSV `descricao;tipo;data;valor;categorias` (multipart, campo `arquivo`) */
  importar: (arquivo: File) => {
    const formulario = new FormData()
    formulario.append('arquivo', arquivo)
    return http.post<ResultadoImportacao>('/lancamentos/importar', { corpo: formulario })
  },

  /** Exporta com os filtros ativos (ignora a paginação) */
  exportar: (formato: FormatoExportacao, filtros: FiltrosLancamentos = {}): Promise<ArquivoBaixado> =>
    http.baixar('/lancamentos/exportar', { ...filtros, formato }),

  baixarModeloCsv: (): Promise<ArquivoBaixado> => http.baixar('/lancamentos/template-csv'),
}
