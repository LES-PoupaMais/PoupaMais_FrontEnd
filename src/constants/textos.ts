import type { StatusLancamento } from '@/types/api'

// Textos repetidos em mais de uma tela: um lugar só (doc/textos-aprovados.md).

/** Toast do Restaurar (Lixeira, visualização e Editar). Desde a v1.2.0 o lançamento volta ao status de antes da lixeira. */
export const TOAST_RESTAURADO: Record<Exclude<StatusLancamento, 'DELETADO'>, string> = {
  INATIVO: 'Restaurado como inativo. Ative para voltar ao dashboard.',
  ATIVO: 'Lançamento restaurado',
}

/** Texto do Restaurar pelo status que a API devolveu */
export function textoRestaurado(status: StatusLancamento): string {
  return status === 'ATIVO' ? TOAST_RESTAURADO.ATIVO : TOAST_RESTAURADO.INATIVO
}

/** Estado "Lançamento não encontrado" (visualização e Editar): um texto só */
export const LANCAMENTO_NAO_ENCONTRADO = {
  titulo: 'Lançamento não encontrado',
  texto: 'Ele pode ter sido excluído ou o endereço está errado.',
} as const
