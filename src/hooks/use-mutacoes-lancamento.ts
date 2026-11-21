import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidarApos } from '@/lib/invalidacoes'
import { lancamentosService } from '@/services/lancamentos.service'
import type { LancamentoRequest, StatusLancamento } from '@/types/api'

// Mutations de lançamento. Todas invalidam lista + detalhe + lixeira + dashboard + contagem por categoria (lib/invalidacoes).
// Toasts e navegação ficam no Context da tela (onSuccess/onError do `mutate`), não aqui.

/** Cria (sem `id`) ou edita (com `id`) */
export function useSalvarLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dados }: LancamentoRequest & { id?: number }) =>
      id === undefined ? lancamentosService.criar(dados) : lancamentosService.atualizar(id, dados),
    onSuccess: () => invalidarApos(queryClient, 'lancamentoSalvo'),
  })
}

/** "Conta no saldo" */
export function useAlterarStatusLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Exclude<StatusLancamento, 'DELETADO'> }) =>
      lancamentosService.alterarStatus(id, status),
    onSuccess: () => invalidarApos(queryClient, 'saldoAlterado'),
  })
}

/** DELETE na hora (status DELETADO, guardando o status anterior). Com Desfazer: `useMoverParaLixeiraComDesfazer` */
export function useMoverParaLixeira() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => lancamentosService.moverParaLixeira(id),
    onSuccess: () => invalidarApos(queryClient, 'lancamentoNaLixeira'),
  })
}

/** Restaura ao status de antes da lixeira (v1.2.0; itens antigos sem esse dado voltam INATIVO) */
export function useRestaurarLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => lancamentosService.restaurar(id),
    onSuccess: () => invalidarApos(queryClient, 'lancamentoRestaurado'),
  })
}
