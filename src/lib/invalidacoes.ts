import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'

// Invalidação centralizada: cada mutação diz aqui quais consultas recarrega (chaves de constants/query-keys).
// Com o cache de 5 min (AppProviders), é isto que faz as telas mostrarem o dado novo depois de uma mudança.
// A lixeira é uma lista de lançamentos (status DELETADO): entra na família `lancamentos`, junto com listas e detalhes.

const DADOS_FINANCEIROS = [queryKeys.lancamentos.todos, queryKeys.dashboard.todos, queryKeys.categorias.todas] as const

export const INVALIDACOES = {
  /** Criar ou editar lançamento: listas, detalhe, lixeira, dashboard (RN003/RN004) e contagem por categoria */
  lancamentoSalvo: DADOS_FINANCEIROS,
  /** "Conta no saldo" */
  saldoAlterado: DADOS_FINANCEIROS,
  /** Mover para a lixeira (inclusive quando falha: a linha tirada do cache volta) */
  lancamentoNaLixeira: DADOS_FINANCEIROS,
  /** Restaurar da lixeira (inclusive o Desfazer que falhou) */
  lancamentoRestaurado: DADOS_FINANCEIROS,
  /** Importar CSV/Excel (pode criar categorias) */
  importacao: DADOS_FINANCEIROS,
  /** Categoria criada, renomeada, inativada, reativada ou excluída: os nomes aparecem nas listas e no dashboard */
  categoriaAlterada: [queryKeys.categorias.todas, queryKeys.lancamentos.todos, queryKeys.dashboard.todos],
  /** Perfil (foto): o usuário de `usuarios/me` (Sidebar, TopBar e Perfil) */
  perfil: [queryKeys.usuario.eu],
} as const satisfies Record<string, readonly QueryKey[]>

export type Mutacao = keyof typeof INVALIDACOES

/** Recarrega as consultas que a mutação afeta. Login e logout não passam por aqui: limpam tudo (`queryClient.clear()`). */
export function invalidarApos(queryClient: QueryClient, mutacao: Mutacao) {
  return Promise.all(INVALIDACOES[mutacao].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}
