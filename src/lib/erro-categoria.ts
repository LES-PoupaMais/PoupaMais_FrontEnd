import { ErroApi } from './http'

/** Mensagem do campo Nome para uma categoria duplicada (`409`, sem diferenciar maiúsculas) */
export const MENSAGEM_CATEGORIA_DUPLICADA = 'Já existe uma categoria com esse nome.'

/**
 * Erro que vai no campo Nome do diálogo de categoria: `409` (duplicada) ou o primeiro `erros[]` de um `400`.
 * Outros erros (`null`) viram toast na tela.
 */
export function erroDoNomeDaCategoria(erro: unknown): string | null {
  if (!(erro instanceof ErroApi)) return null
  if (erro.status === 409) return MENSAGEM_CATEGORIA_DUPLICADA
  if (erro.status === 400 && erro.erros.length > 0) return erro.erros[0].mensagem
  return null
}

/** `DELETE /categorias/{id}` respondeu `422`: a categoria está em uso em lançamentos */
export function categoriaEmUso(erro: unknown): boolean {
  return erro instanceof ErroApi && erro.status === 422
}
