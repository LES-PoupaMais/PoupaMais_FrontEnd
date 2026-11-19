import { useMutation } from '@tanstack/react-query'
import { salvarArquivo } from '@/lib/baixar-arquivo'
import { lancamentosService } from '@/services/lancamentos.service'
import type { FiltrosLancamentos, FormatoExportacao } from '@/types/api'

// Downloads de Lançamentos: exportar com os filtros ativos (RN013) e baixar o modelo CSV.
// O nome do arquivo vem do `Content-Disposition`; sem ele, um nome padrão. Toasts ficam no Context da tela.

/** Exporta (CSV ou XLSX) com os filtros da lista, sem paginação */
export function useExportarLancamentos() {
  return useMutation({
    mutationFn: async ({ formato, filtros }: { formato: FormatoExportacao; filtros: FiltrosLancamentos }) => {
      const { blob, nomeArquivo } = await lancamentosService.exportar(formato, filtros)
      const nome = nomeArquivo ?? `lancamentos.${formato}`
      salvarArquivo(blob, nome)
      return nome
    },
  })
}

/** Toasts do "Baixar modelo CSV" (mesmos textos em Lançamentos, Importar e no vazio do Dashboard) */
export const TOAST_MODELO_CSV = { sucesso: 'Modelo CSV baixado', erro: 'Não foi possível baixar o modelo.' } as const

/** Modelo `descricao;tipo;data;valor;categorias` para importar */
export function useBaixarModeloCsv() {
  return useMutation({
    mutationFn: async () => {
      const { blob, nomeArquivo } = await lancamentosService.baixarModeloCsv()
      const nome = nomeArquivo ?? 'modelo-lancamentos.csv'
      salvarArquivo(blob, nome)
      return nome
    },
  })
}
