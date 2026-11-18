import { nomeDoMes } from './format'

// Datas do lançamento: a API usa "AAAA-MM-DD" (data sem hora, sem fuso) e a auditoria usa instantes ISO em UTC.
// Formatos do Design System: campo e tabela "18/11/2026", lista do celular "18 nov", visualização "18 de novembro de 2026".

export const ANO_MINIMO = 2000
export const ANO_MAXIMO = 2100

const FORMATO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const FORMATO_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/

type PartesData = { dia: number; mes: number; ano: number }

function partes(iso: string): PartesData | null {
  const casou = FORMATO_ISO.exec(iso)
  if (!casou) return null
  const [ano, mes, dia] = casou.slice(1).map(Number)
  // Confere se o dia existe (2026-02-31 não existe): a data UTC montada precisa devolver as mesmas partes.
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null
  return { dia, mes, ano }
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** "2026-11-18" é uma data que existe? (só o formato e o calendário; a faixa de anos fica no schema) */
export function ehDataIsoValida(iso: string): boolean {
  return partes(iso) !== null
}

/** "2026-11-18" → { dia: 18, mes: 11, ano: 2026 }. Erro se a data não existe. */
export function partesDaData(iso: string): PartesData {
  const resultado = partes(iso)
  if (!resultado) throw new RangeError(`Data inválida: ${iso}`)
  return resultado
}

/** "2026-11-18" → "18/11/2026" (campo e tabela) */
export function formatarData(iso: string): string {
  const { dia, mes, ano } = partesDaData(iso)
  return `${doisDigitos(dia)}/${doisDigitos(mes)}/${ano}`
}

/** "2026-11-18" → "18 nov" (linha da lista no celular) */
export function formatarDataCurta(iso: string): string {
  const { dia, mes } = partesDaData(iso)
  return `${dia} ${nomeDoMes(mes).slice(0, 3).toLowerCase()}`
}

/** "2026-11-18" → "18 de novembro de 2026" (visualização e aria-label do DatePicker) */
export function formatarDataExtenso(iso: string): string {
  const { dia, mes, ano } = partesDaData(iso)
  return `${dia} de ${nomeDoMes(mes).toLowerCase()} de ${ano}`
}

/** "18/11/2026" → "2026-11-18"; devolve null se o texto não for uma data que existe */
export function dataBrParaIso(texto: string): string | null {
  const casou = FORMATO_BR.exec(texto.trim())
  if (!casou) return null
  const [dia, mes, ano] = casou.slice(1)
  const iso = `${ano}-${mes}-${dia}`
  return ehDataIsoValida(iso) ? iso : null
}

/** Date local → "2026-11-18" (usa o dia do calendário local, não o UTC) */
export function paraDataIso(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`
}

/** Hoje no fuso local, em "AAAA-MM-DD" (atalho "Hoje" do DatePicker e valor inicial do formulário) */
export function hojeIso(agora: Date = new Date()): string {
  return paraDataIso(agora)
}

/** Instante da auditoria ("2026-11-05T22:42:00Z") → "05/11/2026 às 19:42", no fuso de quem vê */
export function formatarInstante(instante: string): string {
  const data = new Date(instante)
  if (Number.isNaN(data.getTime())) throw new RangeError(`Instante inválido: ${instante}`)
  const hora = `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
  return `${formatarData(paraDataIso(data))} às ${hora}`
}
