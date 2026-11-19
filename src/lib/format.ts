const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Sinal de menos tipográfico (U+2212): o Design System usa "−", não o hífen. */
export const MENOS = '−'

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

/** A API manda número (o back usa BigDecimal); aceita também a string decimal "1120.35". */
export type ValorMonetario = number | string

function paraNumero(valor: ValorMonetario): number {
  const numero = typeof valor === 'string' ? Number(valor) : valor
  if (!Number.isFinite(numero)) {
    throw new RangeError(`Valor inválido: ${valor}`)
  }
  return numero
}

/** 8500 → "R$ 8.500,00" (sempre com centavos; negativo sai com "-" do Intl: prefira formatarSaldo) */
export function formatarMoeda(valor: ValorMonetario): string {
  return moeda.format(paraNumero(valor))
}

/** Valor de lançamento: "+ R$ 8.500,00" (receita) ou "− R$ 680,00" (despesa). O sinal vem do tipo, nunca do número. */
export function formatarValorComSinal(valor: ValorMonetario, tipo: 'RECEITA' | 'DESPESA'): string {
  return `${tipo === 'RECEITA' ? '+' : MENOS} ${formatarMoeda(Math.abs(paraNumero(valor)))}`
}

/** Totais e saldo (neutro): "R$ 4.920,00" ou "− R$ 750,40" */
export function formatarSaldo(valor: ValorMonetario): string {
  const numero = paraNumero(valor)
  return numero < 0 ? `${MENOS} ${formatarMoeda(Math.abs(numero))}` : formatarMoeda(numero)
}

/** 8 → "Agosto" */
export function nomeDoMes(mes: number): string {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new RangeError(`Mês inválido: ${mes}`)
  }
  return MESES[mes - 1]
}

/** (8, 2026) → "Ago/2026" */
export function formatarPeriodo(mes: number, ano: number): string {
  return `${nomeDoMes(mes).slice(0, 3)}/${ano}`
}

/** (11, 2026) → "Novembro 2026" (mês do filtro, no topo do Dashboard e de Lançamentos) */
export function formatarMesAno(mes: number, ano: number): string {
  return `${nomeDoMes(mes)} ${ano}`
}

const porcentagem = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Taxa e participação: 60.6 → "60,6%", 52 → "52%", 112 → "112%" (até uma casa, sem arredondar a faixa: ela vem da API) */
export function formatarPorcentagem(valor: number): string {
  if (!Number.isFinite(valor)) throw new RangeError(`Porcentagem inválida: ${valor}`)
  return `${porcentagem.format(valor)}%`
}

/** Soma valores monetários em centavos (sem erro de ponto flutuante): ['186.40', 127.8] → 314.2 */
export function somarValores(valores: readonly ValorMonetario[]): number {
  return valores.reduce<number>((total, valor) => total + Math.round(paraNumero(valor) * 100), 0) / 100
}

const numeroBR = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 1234.5 → "1.234,50" (o campo de valor mostra assim ao sair; o "R$" fica no prefixo do campo) */
export function formatarNumeroBR(valor: number): string {
  return numeroBR.format(valor)
}

/**
 * Lê o valor do jeito que as pessoas digitam (DS: MoneyField): "180", "180,5", "1.234,56", "R$ 1.234,56".
 * Com vírgula, o ponto é separador de milhar. Sem vírgula, ponto seguido de 3 dígitos é milhar e com 1–2 dígitos é decimal.
 * O sinal nunca é digitado: "−" e "-" são ignorados. Devolve o número com 2 casas, ou null se não houver dígito.
 */
export function parseBRL(texto: string): number | null {
  const limpo = texto.replace(/[^\d.,]/g, '')
  if (!/\d/.test(limpo)) return null

  let inteiro: string
  let decimal = ''
  const virgula = limpo.lastIndexOf(',')
  if (virgula >= 0) {
    inteiro = limpo.slice(0, virgula).replace(/[.,]/g, '')
    decimal = limpo.slice(virgula + 1).replace(/[.,]/g, '')
  } else {
    const ponto = limpo.lastIndexOf('.')
    const depois = ponto >= 0 ? limpo.slice(ponto + 1) : ''
    if (ponto >= 0 && depois.length !== 3 && depois.length > 0) {
      inteiro = limpo.slice(0, ponto).replace(/\./g, '')
      decimal = depois
    } else {
      inteiro = limpo.replace(/\./g, '')
    }
  }

  const numero = Number(`${inteiro || '0'}.${decimal || '0'}`)
  return Math.round(numero * 100) / 100
}

/** "1 lançamento" · "3 lançamentos" (contagens nos textos da interface) */
export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`
}
