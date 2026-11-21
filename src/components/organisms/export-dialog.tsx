'use client'

import { ChevronLeft, Download, FileSpreadsheet, FileText, Sheet as IconePlanilha, X } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/atoms/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/atoms/dialog'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { ActionBanner } from '@/components/molecules/action-banner'
import { SegmentedControl, type OpcaoSegmentada } from '@/components/molecules/segmented-control'
import type { FormatoExportacao } from '@/types/api'

// Exportar lançamentos (pranchetas exportar-celular e exportar-computador): pergunta o formato (CSV ou Excel) e avisa que o
// arquivo segue os filtros ativos (RN013); a lixeira fica de fora (exportar a lixeira não está no escopo). Sem dados: "Não há
// dados para exportação". Celular: tela cheia com "‹" e "Baixar arquivo" fixo embaixo; tablet e computador: card de 640px centralizado.
// Puro: formato, resumo e ações por props.

const OPCOES: OpcaoSegmentada<FormatoExportacao>[] = [
  { value: 'csv', label: 'CSV', icon: <FileText className="size-5" aria-hidden="true" /> },
  { value: 'xlsx', label: 'Excel', icon: <FileSpreadsheet className="size-5" aria-hidden="true" /> },
]

const AJUDA: Record<FormatoExportacao, string> = {
  csv: 'CSV: abre em qualquer planilha e serve para importar de novo.',
  xlsx: 'Excel (.xlsx): abre direto no Excel, com as colunas já separadas.',
}

export const SEM_DADOS_PARA_EXPORTAR = 'Não há dados para exportação'

export type ExportDialogProps = {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  formato: FormatoExportacao
  onFormatoChange: (formato: FormatoExportacao) => void
  /** Filtros ativos em texto ("Novembro 2026 · Todos os status") */
  filtrosAtivos: string
  /** Quantos lançamentos vão no arquivo (`total` da lista); `null` se ainda não se sabe */
  total: number | null
  /** De onde vêm ("Novembro 2026 · os que contam e os que não contam no saldo") */
  origem: string
  onBaixar: () => void
  baixando?: boolean
  /** "Mudar filtros" no aviso (fecha e leva aos filtros) */
  onMudarFiltros?: () => void
  /** Sem internet: Baixar desabilitado, com o id do texto do motivo */
  motivoDesabilitado?: string
}

export function ExportDialog({
  aberto,
  onAbertoChange,
  formato,
  onFormatoChange,
  filtrosAtivos,
  total,
  origem,
  onBaixar,
  baixando = false,
  onMudarFiltros,
  motivoDesabilitado,
}: ExportDialogProps) {
  const base = useId()
  const idResumo = `${base}-resumo`
  const semDados = total === 0
  const bloqueado = semDados || Boolean(motivoDesabilitado)
  const plural = total === null ? 'Lançamentos' : `${total} ${total === 1 ? 'lançamento' : 'lançamentos'}`

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent
        showCloseButton={false}
        className="max-md:bg-background flex flex-col gap-0 overflow-y-auto p-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0 max-md:shadow-none md:max-w-[640px]"
      >
        <div className="border-border bg-card flex min-h-14 items-center gap-1 border-b px-2 md:hidden">
          <DialogClose asChild>
            <Button variant="texto" size="icone" aria-label="Voltar para Lançamentos">
              <ChevronLeft aria-hidden="true" />
            </Button>
          </DialogClose>
          <span aria-hidden="true" className="text-titulo-3">
            Exportar lançamentos
          </span>
        </div>
        <div className="flex flex-col gap-5 p-5 md:p-6">
          {/* Computador: título (titulo-2, como a prancheta exportar-computador) com o × de fechar no canto */}
          <div className="flex items-start justify-between gap-3 max-md:contents">
            <div className="flex flex-col gap-1 max-md:sr-only">
              <DialogTitle className="text-titulo-2">Exportar lançamentos</DialogTitle>
              <DialogDescription className="text-corpo text-muted-foreground">
                Baixe os lançamentos da lista para abrir numa planilha.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="texto" size="icone" aria-label="Fechar" className="-mt-2 -mr-3 shrink-0 max-md:hidden">
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>
          <ActionBanner
            texto={`O arquivo segue os filtros ativos: ${filtrosAtivos}`}
            acoes={onMudarFiltros ? [{ rotulo: 'Mudar filtros', onClick: onMudarFiltros }] : undefined}
          />
          <div className="flex flex-col gap-1.5">
            <SegmentedControl
              label="Formato do arquivo"
              bloco
              options={OPCOES}
              value={formato}
              onChange={onFormatoChange}
            />
            <span className="text-legenda text-muted-foreground">{AJUDA[formato]}</span>
          </div>
          <section
            aria-labelledby={idResumo}
            className="border-border max-md:rounded-card max-md:bg-card max-md:shadow-card flex flex-col gap-3 max-md:border max-md:p-4 md:border-t md:pt-4"
          >
            <h2 id={idResumo} className="text-rotulo-secao text-muted-foreground uppercase">
              O que vai no arquivo
            </h2>
            <div className="flex items-center gap-3">
              <FunctionIcon funcao="primaria" icone={IconePlanilha} />
              <div className="flex flex-col">
                <span className="text-corpo-forte tabular-nums">{semDados ? SEM_DADOS_PARA_EXPORTAR : plural}</span>
                <span className="text-legenda text-muted-foreground">{origem}</span>
              </div>
            </div>
            <p className="text-legenda text-muted-foreground">A lixeira fica de fora.</p>
          </section>
        </div>
        <div className="border-border bg-card mt-auto flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4 max-md:sticky max-md:bottom-0 md:px-6">
          <DialogClose asChild>
            <Button variant="contornado" className="max-md:hidden">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            loading={baixando}
            className="max-md:w-full"
            aria-disabled={bloqueado || undefined}
            aria-describedby={motivoDesabilitado}
            onClick={() => {
              if (!bloqueado) onBaixar()
            }}
          >
            {!baixando && <Download aria-hidden="true" />}
            Baixar arquivo
          </Button>
          {motivoDesabilitado && (
            <p
              id={motivoDesabilitado}
              className="text-legenda text-muted-foreground w-full text-right max-md:text-center"
            >
              Sem internet. Baixe o arquivo quando a conexão voltar.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
