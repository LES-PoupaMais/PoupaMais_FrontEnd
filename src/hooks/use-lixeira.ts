import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys } from '@/constants/query-keys'
import type { Lancamento, Pagina } from '@/types/api'
import { invalidarDadosFinanceiros } from './invalidacao'
import { useMoverParaLixeira, useRestaurarLancamento } from './use-mutacoes-lancamento'

// "Mover para a lixeira" com Desfazer (decisão do líder, 19/11): o DELETE vai NA HORA e o Desfazer do toast chama o
// restaurar, que devolve o lançamento ao status de antes da lixeira (contrato v1.2.0). A linha some na hora (o item sai
// das listas em cache) e, depois, lista, dashboard e lixeira são recarregados (invalidarDadosFinanceiros).

export type CallbacksDaLixeira = {
  /** O DELETE falhou: a linha volta (as listas recarregam) */
  onErroAoMover?: (erro: unknown) => void
  /** O Desfazer (restaurar) falhou: as listas recarregam */
  onErroAoDesfazer?: (erro: unknown) => void
}

export type MovidoParaLixeira = {
  /** Resolve quando o DELETE terminou (rejeita em erro) */
  envio: Promise<void>
  /** Espera o DELETE terminar e restaura. Só restaura uma vez. */
  desfazer: () => Promise<void>
}

type DadosDaLista = InfiniteData<Pagina<Lancamento>, number>

/** Tira o lançamento das listas em cache (e desconta do total), para a linha sumir antes da resposta */
function tirarDasListas(dados: DadosDaLista | undefined, id: number): DadosDaLista | undefined {
  if (!dados || !dados.pages.some((pagina) => pagina.itens.some((l) => l.id === id))) return dados
  return {
    ...dados,
    pages: dados.pages.map((pagina) => ({
      ...pagina,
      itens: pagina.itens.filter((l) => l.id !== id),
      total: Math.max(0, pagina.total - 1),
    })),
  }
}

export function useMoverParaLixeiraComDesfazer() {
  const queryClient = useQueryClient()
  const { mutateAsync: excluir } = useMoverParaLixeira()
  const { mutateAsync: restaurar } = useRestaurarLancamento()

  return useCallback(
    (id: number, { onErroAoMover, onErroAoDesfazer }: CallbacksDaLixeira = {}): MovidoParaLixeira => {
      void queryClient.cancelQueries({ queryKey: [...queryKeys.lancamentos.todos, 'lista'] })
      queryClient.setQueriesData<DadosDaLista>({ queryKey: [...queryKeys.lancamentos.todos, 'lista'] }, (dados) =>
        tirarDasListas(dados, id),
      )

      const envio = excluir(id).catch((erro: unknown) => {
        void invalidarDadosFinanceiros(queryClient)
        onErroAoMover?.(erro)
        throw erro
      })
      // Quem não esperar o envio não deixa a rejeição solta
      envio.catch(() => {})

      let desfeito: Promise<void> | null = null
      const desfazer = () => {
        desfeito ??= envio.then(
          async () => {
            try {
              await restaurar(id)
            } catch (erro) {
              void invalidarDadosFinanceiros(queryClient)
              onErroAoDesfazer?.(erro)
            }
          },
          // O DELETE falhou: não há o que restaurar (o erro já foi avisado)
          () => {},
        )
        return desfeito
      }
      return { envio, desfazer }
    },
    [queryClient, excluir, restaurar],
  )
}
