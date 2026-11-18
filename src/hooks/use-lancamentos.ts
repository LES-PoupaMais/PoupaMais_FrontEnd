import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { lancamentosService, TAMANHO_PAGINA } from '@/services/lancamentos.service'
import type { FiltrosLancamentos } from '@/types/api'

/**
 * Lista paginada com "Mostrar mais" (useInfiniteQuery). `itens` junta as páginas já carregadas e `total`
 * alimenta o contador "Mostrando 12 de 30". Use `fetchNextPage`, `hasNextPage` e `isFetchingNextPage`.
 */
export function useLancamentos(
  filtros: FiltrosLancamentos = {},
  { tamanho = TAMANHO_PAGINA }: { tamanho?: number } = {},
) {
  return useInfiniteQuery({
    queryKey: queryKeys.lancamentos.lista({ ...filtros, tamanho }),
    queryFn: ({ pageParam }) => lancamentosService.listar({ ...filtros, pagina: pageParam, tamanho }),
    initialPageParam: 0,
    getNextPageParam: (ultima) => (ultima.pagina + 1 < ultima.totalPaginas ? ultima.pagina + 1 : undefined),
    select: (dados) => ({
      itens: dados.pages.flatMap((pagina) => pagina.itens),
      total: dados.pages.at(-1)?.total ?? 0,
    }),
  })
}

/** Um lançamento (Visualizar e Editar) */
export function useLancamento(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.lancamentos.detalhe(id ?? 0),
    queryFn: () => lancamentosService.buscar(id as number),
    enabled: id !== undefined,
  })
}
