'use client'

import { CircleAlert, CircleCheck, Download, FileText, FileX, List, TriangleAlert, Upload } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { cn } from '@/lib/cn'
import { plural } from '@/lib/format'
import type { ResultadoImportacao } from '@/types/api'

// Resultado da importação de CSV (DS: ImportResult; pranchetas importar-resultado e importar-invalido). RN007: quantos entraram,
// quais linhas foram ignoradas (linha + motivo + texto lido) e as categorias criadas (RN002).
// Estados: com linhas ignoradas · só linhas inválidas ("Nada foi importado") · arquivo vazio · tudo certo.
// Puro: o resultado, os destinos e "importar outro" chegam por props.

export type ImportResultProps = {
  resultado: ResultadoImportacao
  /** Nome do arquivo enviado */
  nomeArquivo: string
  /** "Ver lançamentos" */
  hrefLancamentos: string
  /** "Baixar modelo CSV" (`GET /lancamentos/template-csv`): a tela baixa (`useBaixarModeloCsv`) */
  onBaixarModelo: () => void
  /** "Baixar linhas ignoradas (.csv)" (só com falhas): a tela monta o arquivo com as linhas originais e baixa */
  onBaixarLinhasIgnoradas: () => void
  /** Volta para a escolha do arquivo */
  onImportarOutro: () => void
  className?: string
}

const CABECALHO = 'descricao;tipo;data;valor;categorias'
const EXEMPLO = 'Mercado do mês;DESPESA;05/11/2026;1.120,35;Mercado'

function Codigo({ children }: { children: string }) {
  return <code className="text-foreground font-sans font-bold [overflow-wrap:anywhere]">{children}</code>
}

export function ImportResult({
  resultado,
  nomeArquivo,
  hrefLancamentos,
  onBaixarModelo,
  onBaixarLinhasIgnoradas,
  onImportarOutro,
  className,
}: ImportResultProps) {
  const { totalLinhas, importados, falhas, categoriasCriadas } = resultado
  const vazio = totalLinhas === 0
  const nada = !vazio && importados === 0
  const titulo = vazio ? 'O arquivo está vazio' : nada ? 'Nada foi importado' : 'Importação concluída'

  const baixarModelo = (variante: 'primario' | 'contornado') => (
    <Button variant={variante} onClick={onBaixarModelo}>
      <Download aria-hidden="true" />
      Baixar modelo CSV
    </Button>
  )

  return (
    <article
      data-slot="import-result"
      aria-labelledby="import-result-titulo"
      className={cn(
        'rounded-grande border-border bg-card text-card-foreground shadow-card flex flex-col gap-5 border p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <FunctionIcon funcao={vazio || nada ? 'neutro' : 'primaria'} icone={vazio || nada ? FileX : FileText} />
        <div className="min-w-0">
          <h2 id="import-result-titulo" className="text-titulo-2">
            {titulo}
          </h2>
          <p className="text-legenda text-muted-foreground [overflow-wrap:anywhere]">
            {nomeArquivo} · {plural(totalLinhas, 'linha lida', 'linhas lidas')}
          </p>
        </div>
      </div>

      {vazio ? (
        <p role="status" className="text-corpo text-muted-foreground">
          Nenhum lançamento foi importado. Use o modelo: cabeçalho <Codigo>{CABECALHO}</Codigo> e uma linha por
          lançamento, com a data em dd/mm/aaaa. Exemplo: <Codigo>{EXEMPLO}</Codigo>
        </p>
      ) : (
        <ul role="status" className="flex flex-wrap gap-x-4 gap-y-2">
          <li
            className={cn(
              'text-corpo-forte inline-flex items-center gap-2 tabular-nums',
              nada ? 'text-destructive' : 'text-receita',
            )}
          >
            {nada ? (
              <CircleAlert className="size-5" aria-hidden="true" />
            ) : (
              <CircleCheck className="size-5" aria-hidden="true" />
            )}
            {plural(importados, 'lançamento importado', 'lançamentos importados')}
          </li>
          {falhas.length > 0 && (
            <li className="text-corpo-forte text-atencao inline-flex items-center gap-2 tabular-nums">
              <TriangleAlert className="size-5" aria-hidden="true" />
              {plural(falhas.length, 'linha ignorada', 'linhas ignoradas')}
            </li>
          )}
        </ul>
      )}

      {falhas.length > 0 && (
        <div className="border-border rounded-campo overflow-hidden border">
          <table className="text-legenda w-full border-collapse">
            <caption className="text-rotulo-secao text-muted-foreground bg-secondary px-4 py-3 text-left uppercase">
              {nada ? 'Por que cada linha ficou de fora' : 'Linhas ignoradas'}
            </caption>
            <thead>
              <tr className="border-border border-b">
                <th scope="col" className="text-muted-foreground px-4 py-2 text-left font-bold">
                  Linha
                </th>
                <th scope="col" className="text-muted-foreground px-4 py-2 text-left font-bold">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody>
              {falhas.map((falha) => (
                <tr key={falha.linha} className="border-border border-b last:border-b-0">
                  <td className="w-18 px-4 py-3 align-top font-bold whitespace-nowrap tabular-nums">
                    Linha {falha.linha}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="font-semibold">{falha.motivo}</span>
                    <span className="text-muted-foreground mt-0.5 block [overflow-wrap:anywhere] tabular-nums">
                      {falha.conteudo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {falhas.length > 0 && (
        <div className="flex flex-col items-start gap-3">
          {nada ? (
            <p className="text-corpo text-muted-foreground">
              Nenhum lançamento foi salvo. Baixe o modelo, confira o cabeçalho <Codigo>{CABECALHO}</Codigo> e tente de
              novo.
            </p>
          ) : (
            <p className="text-legenda text-muted-foreground">
              As linhas ignoradas não foram salvas. Corrija no arquivo e importe só essas linhas de novo.
            </p>
          )}
          {/* Fora do DS (aprovação pendente): as linhas originais com o cabeçalho do modelo, para corrigir e reenviar */}
          <Button variant="contornado" onClick={onBaixarLinhasIgnoradas}>
            <Download aria-hidden="true" />
            Baixar linhas ignoradas (.csv)
          </Button>
        </div>
      )}

      {categoriasCriadas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-rotulo-secao text-muted-foreground uppercase">Categorias criadas</span>
          {categoriasCriadas.map((nome) => (
            <span
              key={nome}
              className="rounded-pilula bg-secondary text-foreground inline-flex min-h-[22px] max-w-35 items-center truncate px-2 text-xs leading-[18px] font-semibold"
            >
              {nome}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {vazio || nada ? (
          <>
            {baixarModelo('primario')}
            <Button variant="contornado" onClick={onImportarOutro}>
              <Upload aria-hidden="true" />
              Escolher outro arquivo
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href={hrefLancamentos}>
                <List aria-hidden="true" />
                Ver lançamentos
              </Link>
            </Button>
            {falhas.length > 0 && (
              <>
                {baixarModelo('contornado')}
                <Button variant="texto" onClick={onImportarOutro}>
                  <Upload aria-hidden="true" />
                  Importar outro arquivo
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </article>
  )
}
