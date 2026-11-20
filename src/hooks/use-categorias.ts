import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { invalidarApos } from '@/lib/invalidacoes'
import { categoriasService } from '@/services/categorias.service'
import type { CategoriaRequest, FiltrosCategorias } from '@/types/api'

/** Categorias com a contagem de lançamentos do mês (`mes`/`ano` não filtram a lista, só a contagem) */
export function useCategorias(filtros: FiltrosCategorias = {}) {
  return useQuery({ queryKey: queryKeys.categorias.lista(filtros), queryFn: () => categoriasService.listar(filtros) })
}

/** Cria (sem `id`) ou renomeia (com `id`). Invalida categorias, lançamentos e dashboard (os nomes aparecem nos três). */
export function useSalvarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dados }: CategoriaRequest & { id?: number }) =>
      id === undefined ? categoriasService.criar(dados) : categoriasService.atualizar(id, dados),
    onSuccess: () => invalidarApos(queryClient, 'categoriaAlterada'),
  })
}
