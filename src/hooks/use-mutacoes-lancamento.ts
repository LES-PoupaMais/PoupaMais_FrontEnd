import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lancamentosService } from '@/services/lancamentos.service'
import type { LancamentoRequest, StatusLancamento } from '@/types/api'
import { invalidarDadosFinanceiros } from './invalidacao'

// Mutations de lançamento. Todas invalidam lista + detalhe + dashboard + contagem por categoria.
// Toasts e navegação ficam no Context da tela (onSuccess/onError do `mutate`), não aqui.

/** Cria (sem `id`) ou edita (com `id`) */
export function useSalvarLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dados }: LancamentoRequest & { id?: number }) =>
      id === undefined ? lancamentosService.criar(dados) : lancamentosService.atualizar(id, dados),
    onSuccess: () => invalidarDadosFinanceiros(queryClient),
  })
}

/** "Conta no saldo" */
export function useAlterarStatusLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Exclude<StatusLancamento, 'DELETADO'> }) =>
      lancamentosService.alterarStatus(id, status),
    onSuccess: () => invalidarDadosFinanceiros(queryClient),
  })
}

/** Só chame quando o toast "Movido para a lixeira · Desfazer" fechar sem Desfazer (ou ao sair da página) */
export function useMoverParaLixeira() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => lancamentosService.moverParaLixeira(id),
    onSuccess: () => invalidarDadosFinanceiros(queryClient),
  })
}

/** Restaura como INATIVO */
export function useRestaurarLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => lancamentosService.restaurar(id),
    onSuccess: () => invalidarDadosFinanceiros(queryClient),
  })
}
