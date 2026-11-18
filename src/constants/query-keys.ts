import type { FiltrosCategorias, FiltrosLancamentos, MesAno } from '@/types/api'

// Chaves do TanStack Query: sempre por aqui, nunca string solta.
// A primeira posição é a "família": invalidar ['lancamentos'] atinge todas as listas e detalhes.
export const queryKeys = {
  lancamentos: {
    todos: ['lancamentos'] as const,
    lista: (filtros: FiltrosLancamentos & { tamanho?: number }) => ['lancamentos', 'lista', filtros] as const,
    detalhe: (id: number) => ['lancamentos', 'detalhe', id] as const,
  },
  categorias: {
    todas: ['categorias'] as const,
    lista: (filtros: FiltrosCategorias) => ['categorias', 'lista', filtros] as const,
  },
  dashboard: {
    todos: ['dashboard'] as const,
    mes: (periodo: MesAno) => ['dashboard', periodo] as const,
  },
  usuario: {
    eu: ['usuario', 'me'] as const,
  },
}
