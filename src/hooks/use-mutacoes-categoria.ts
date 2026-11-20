import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidarApos } from '@/lib/invalidacoes'
import { categoriasService } from '@/services/categorias.service'

// Inativar/reativar e excluir categoria (criar e renomear ficam em `use-categorias.ts`).
// Invalidam categorias, lançamentos e dashboard (lib/invalidacoes). Toasts ficam no Context da tela.

/** `PATCH /categorias/{id}/status`: inativa (sai da lista de escolha) ou reativa */
export function useAlterarStatusCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativa }: { id: number; ativa: boolean }) => categoriasService.alterarStatus(id, ativa),
    onSuccess: () => invalidarApos(queryClient, 'categoriaAlterada'),
  })
}

/** `DELETE /categorias/{id}`: `422` se a categoria estiver em uso em algum lançamento */
export function useExcluirCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriasService.excluir(id),
    onSuccess: () => invalidarApos(queryClient, 'categoriaAlterada'),
  })
}
