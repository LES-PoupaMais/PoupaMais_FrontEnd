import { ErroApi, traduzirErro } from './http'

/** Mensagem do campo Nome para uma categoria duplicada (`409`, sem diferenciar maiúsculas) */
export const MENSAGEM_CATEGORIA_DUPLICADA = 'Já existe uma categoria com esse nome.'

/**
 * Erro que vai no campo Nome do diálogo de categoria: `409` (duplicada) ou o primeiro campo do `erros[]` de um `400`,
 * já traduzidos por `traduzirErro` (nunca a mensagem crua da API). Outros erros (`null`) viram toast na tela.
 */
export function erroDoNomeDaCategoria(erro: unknown): string | null {
  if (!(erro instanceof ErroApi)) return null
  const { status, mensagem, campos } = traduzirErro(erro, { porStatus: { 409: MENSAGEM_CATEGORIA_DUPLICADA } })
  if (status === 409) return mensagem
  if (status === 400) return Object.values(campos)[0] ?? null
  return null
}

/** `DELETE /categorias/{id}` respondeu `422`: a categoria está em uso em lançamentos */
export function categoriaEmUso(erro: unknown): boolean {
  return erro instanceof ErroApi && erro.status === 422
}
