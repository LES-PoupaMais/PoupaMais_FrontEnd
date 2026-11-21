import { paraDataIso } from '@/lib/data'
import type { FalhaImportacao } from '@/types/api'

// "Baixar linhas ignoradas (.csv)" do resultado da importação (RN007): o cabeçalho do modelo seguido das linhas originais
// que a API devolveu em `falhas[].conteudo`, sem a coluna de motivo, para a pessoa corrigir e reenviar o arquivo como está.
// O `conteudo` vai exatamente como veio (separador e aspas). BOM UTF-8 para o Excel abrir os acentos; quebra de linha \r\n.

export const CABECALHO_MODELO_CSV = 'descricao;tipo;data;valor;categorias'

const BOM = '﻿'
const QUEBRA = '\r\n'

/** Texto do arquivo: BOM + cabeçalho + uma linha original por falha, cada uma terminada em \r\n */
export function montarCsvLinhasIgnoradas(falhas: Pick<FalhaImportacao, 'conteudo'>[]): string {
  return BOM + [CABECALHO_MODELO_CSV, ...falhas.map((falha) => falha.conteudo)].join(QUEBRA) + QUEBRA
}

/** "linhas-ignoradas-AAAA-MM-DD.csv" com a data local de hoje */
export function nomeArquivoLinhasIgnoradas(agora: Date = new Date()): string {
  return `linhas-ignoradas-${paraDataIso(agora)}.csv`
}
