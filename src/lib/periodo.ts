import type { MesAno } from '@/types/api'
import { ANO_MAXIMO, ANO_MINIMO } from './data'

// Mês do filtro (Dashboard e Lançamentos), sempre na URL: `?mes=11&ano=2026`. Sem parâmetro ou inválido = mês atual.
type LeitorDeParametros = { get(nome: string): string | null }

export function mesAtual(agora: Date = new Date()): MesAno {
  return { mes: agora.getMonth() + 1, ano: agora.getFullYear() }
}

export function lerPeriodo(parametros: LeitorDeParametros, agora: Date = new Date()): MesAno {
  const mes = Number(parametros.get('mes'))
  const ano = Number(parametros.get('ano'))
  const valido =
    Number.isInteger(mes) && mes >= 1 && mes <= 12 && Number.isInteger(ano) && ano >= ANO_MINIMO && ano <= ANO_MAXIMO
  return valido ? { mes, ano } : mesAtual(agora)
}

/** Soma (ou subtrai) meses: deslocarMes({mes: 1, ano: 2026}, -1) → {mes: 12, ano: 2025} */
export function deslocarMes({ mes, ano }: MesAno, quantidade: number): MesAno {
  const indice = ano * 12 + (mes - 1) + quantidade
  return { mes: (indice % 12) + 1, ano: Math.floor(indice / 12) }
}

/** Query string do período, preservando os outros filtros */
export function comPeriodo(parametros: URLSearchParams | string, { mes, ano }: MesAno): string {
  const novos = new URLSearchParams(parametros)
  novos.set('mes', String(mes))
  novos.set('ano', String(ano))
  return novos.toString()
}
