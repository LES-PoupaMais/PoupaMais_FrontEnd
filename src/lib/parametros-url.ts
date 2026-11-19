// Parâmetros de URL compartilhados entre telas.
type LeitorDeParametros = { get(nome: string): string | null }

/** `?ver=<id>` (painel da visualização em Lançamentos e na Lixeira): só inteiro positivo; o resto é ignorado */
export function lerVer(parametros: LeitorDeParametros): number | undefined {
  const bruto = parametros.get('ver')
  if (bruto === null || !/^\d+$/.test(bruto)) return undefined
  const id = Number(bruto)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}
