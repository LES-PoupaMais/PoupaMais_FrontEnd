import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'

/**
 * Depois de criar, editar, mudar "Conta no saldo", mover para a lixeira, restaurar ou importar:
 * a lista, o detalhe, o dashboard (RN003/RN004) e a contagem por categoria mudam juntos.
 */
export function invalidarDadosFinanceiros(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.todos }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todos }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categorias.todas }),
  ])
}
