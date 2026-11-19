import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasService } from '@/services/categorias.service'
import { invalidarDadosFinanceiros } from './invalidacao'

// Inativar/reativar e excluir categoria (criar e renomear ficam em `use-categorias.ts`).
// Invalidam categorias, lançamentos e dashboard, como as outras mutações. Toasts ficam no Context da tela.

/** `PATCH /categorias/{id}/status`: inativa (sai da lista de escolha) ou reativa */
export function useAlterarStatusCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativa }: { id: number; ativa: boolean }) => categoriasService.alterarStatus(id, ativa),
    onSuccess: () => invalidarDadosFinanceiros(queryClient),
  })
}

/** `DELETE /categorias/{id}`: `422` se a categoria estiver em uso em algum lançamento */
export function useExcluirCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriasService.excluir(id),
    onSuccess: () => invalidarDadosFinanceiros(queryClient),
  })
}
