'use client'

import { ChevronLeft, Info, LoaderCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { UploadArea } from '@/components/molecules/upload-area'
import { FormatoCsv } from '@/components/organisms/formato-csv'
import { ImportResult } from '@/components/organisms/import-result'
import { ROTAS } from '@/constants/rotas'
import { cn } from '@/lib/cn'
import { formatarData, paraDataIso } from '@/lib/data'
import { useImportarContext } from './ImportarContext'

const MOTIVO_ID = 'importar-motivo'
const AJUDA = 'ou escolha no seu aparelho. Até 2 MB e 5.000 linhas, com a data em dd/mm/aaaa.'

function Cabecalho({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    // No resultado, o cabeçalho fica vazio no celular: some de vez para não somar o espaço da coluna (prancheta importar-resultado)
    <header className={cn('flex flex-col gap-2', titulo !== 'Importar CSV' && 'max-md:hidden')}>
      <Button asChild variant="texto" className="-ml-3 hidden self-start md:inline-flex">
        <Link href={ROTAS.lancamentos}>
          <ChevronLeft aria-hidden="true" />
          Lançamentos
        </Link>
      </Button>
      <div className="flex flex-col gap-1">
        {/* no celular o título está na TopBar */}
        <h1 className="text-titulo-1 hidden md:block">{titulo}</h1>
        <p className={cn('text-corpo text-muted-foreground', titulo !== 'Importar CSV' && 'hidden md:block')}>
          {texto}
        </p>
      </div>
    </header>
  )
}

// Importar CSV: escolher → importando → resultado (pranchetas importar-*, importando-celular, importar-resultado-*).
// Celular: botão fixo no rodapé; a partir de 768px ele fica no card "Arquivo"; computador em 2 colunas.
export function ImportarView() {
  const ctx = useImportarContext()

  if (ctx.importado) {
    const { resultado, nomeArquivo, em } = ctx.importado
    return (
      <div className="mx-auto flex w-full max-w-205 flex-col gap-5 md:gap-6">
        <Cabecalho
          titulo="Resultado da importação"
          texto={`Importado em ${formatarData(paraDataIso(em))} a partir de ${nomeArquivo}.`}
        />
        <ImportResult
          resultado={resultado}
          nomeArquivo={nomeArquivo}
          hrefLancamentos={ROTAS.lancamentos}
          onBaixarModelo={ctx.baixarModelo}
          onImportarOutro={ctx.importarOutro}
        />
      </div>
    )
  }

  const semArquivo = !ctx.arquivo || Boolean(ctx.erroArquivo)
  const bloqueado = !ctx.online
  const motivo = bloqueado ? null : semArquivo && !ctx.importando ? 'Escolha um arquivo para continuar.' : null

  return (
    <div className="mx-auto flex w-full max-w-260 flex-col gap-5 pb-28 md:gap-6 md:pb-0">
      <Cabecalho
        titulo="Importar CSV"
        texto="Traga vários lançamentos de uma vez a partir de uma planilha salva em CSV."
      />
      <div id="modelo-csv" className="grid scroll-mt-20 items-stretch gap-5 md:gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="importar-arquivo"
          className="md:rounded-grande md:border-border md:bg-card md:shadow-card flex min-w-0 flex-col gap-5 md:gap-4 md:border md:p-6"
        >
          <h2 id="importar-arquivo" className="text-titulo-3 sr-only md:not-sr-only">
            Arquivo
          </h2>
          <UploadArea
            arquivo={ctx.arquivo}
            onEscolher={ctx.escolher}
            onRemover={ctx.remover}
            onErro={ctx.setErroArquivo}
            erro={ctx.erroArquivo}
            onBaixarModelo={ctx.baixarModelo}
            ajuda={AJUDA}
            disabled={ctx.importando}
            areaClassName="md:min-h-70 md:flex-1 md:[&_[data-slot=upload-area-modelo]]:hidden"
            className={cn(ctx.importando && 'opacity-60')}
          />
          {ctx.importando && ctx.arquivo ? (
            <section
              role="status"
              aria-live="polite"
              className="rounded-card border-border bg-card shadow-card flex flex-col gap-3 border p-5 md:shadow-none"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-icone bg-accent text-primary grid size-10 shrink-0 place-items-center">
                  <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-corpo-forte [overflow-wrap:anywhere]">Importando {ctx.arquivo.name}</span>
                  <span className="text-legenda text-muted-foreground">
                    Lendo as linhas e criando as categorias novas.
                  </span>
                </div>
              </div>
              <div aria-hidden="true" className="rounded-pilula bg-secondary h-2 overflow-hidden">
                <div className="rounded-pilula bg-primary h-full w-3/5 animate-pulse" />
              </div>
              <p className="text-legenda text-muted-foreground">Isso leva alguns segundos. Não feche esta tela.</p>
            </section>
          ) : (
            <p className="rounded-campo bg-secondary text-legenda text-muted-foreground flex items-start gap-2 px-4 py-3">
              <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>Até 2 MB e 5.000 linhas por arquivo. Para mais, divida em arquivos menores.</span>
            </p>
          )}
          <div
            data-slot="importar-rodape"
            className="bg-card border-border fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] md:static md:z-auto md:border-0 md:bg-transparent md:p-0"
          >
            <div className="flex flex-wrap gap-3">
              <Button
                className="flex-1"
                loading={ctx.importando}
                disabled={!ctx.importando && semArquivo}
                aria-describedby={bloqueado ? MOTIVO_ID : motivo ? `${MOTIVO_ID}-arquivo` : undefined}
                aria-disabled={bloqueado || ctx.importando || undefined}
                onClick={ctx.importar}
              >
                {!ctx.importando && <Upload aria-hidden="true" />}
                {ctx.importando ? 'Importando…' : 'Importar lançamentos'}
              </Button>
              <Button asChild variant="contornado" className="hidden md:inline-flex">
                <Link href={ROTAS.lancamentos}>Cancelar</Link>
              </Button>
            </div>
            {motivo && (
              <p id={`${MOTIVO_ID}-arquivo`} className="text-legenda text-muted-foreground text-center md:text-left">
                {motivo}
              </p>
            )}
            {bloqueado && <OfflineMotivo id={MOTIVO_ID} />}
          </div>
        </section>
        <FormatoCsv onBaixarModelo={ctx.baixarModelo} className={cn(ctx.importando && 'max-md:hidden')} />
      </div>
    </div>
  )
}
