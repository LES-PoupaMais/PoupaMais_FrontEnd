'use client'

import { CircleAlert, Download, FileText, Upload, X } from 'lucide-react'
import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button, buttonVariants } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// Área de envio do Design System (components/UploadArea), genérica: `accept` e `maxBytes` por props (hoje o CSV de até 2 MB,
// RN012). Arrastar é só um atalho: o <input type="file"> real (oculto) fica ligado ao botão "Escolher arquivo" e tudo funciona
// pelo teclado. A área só ESCOLHE o arquivo e confere tipo e tamanho; a importação começa no botão da tela.

export const DOIS_MB = 2 * 1024 * 1024

export type UploadAreaProps = {
  /** Tipos aceitos, como no <input accept>: ".csv,text/csv" */
  accept?: string
  /** Tamanho máximo em bytes (padrão 2 MB) */
  maxBytes?: number
  /** Arquivo escolhido (controlado por quem usa) */
  arquivo: File | null
  onEscolher: (arquivo: File) => void
  onRemover: () => void
  /** Avisa quando a área recusa um arquivo (mensagem) ou quando o erro some (null) */
  onErro?: (mensagem: string | null) => void
  /** Erro vindo de fora (ex.: a API recusou o arquivo) */
  erro?: string | null
  /** Link do modelo ("Baixar modelo CSV"), mostrado no vazio e no erro */
  modeloHref?: string
  /** No lugar do link: a tela baixa o modelo (ex.: `useBaixarModeloCsv`, com toast e o nome do `Content-Disposition`) */
  onBaixarModelo?: () => void
  rotuloModelo?: string
  titulo?: string
  ajuda?: string
  /** Nome do tipo nas mensagens: "<arquivo> não é um arquivo CSV." */
  nomeDoTipo?: string
  /** Enquanto importa: nada pode ser trocado */
  disabled?: boolean
  className?: string
}

const formatoDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** 49152 → "48 KB"; 3565158 → "3,4 MB" */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${formatoDecimal.format(bytes / (1024 * 1024))} MB`
}

function aceita(arquivo: File, accept: string): boolean {
  const tipos = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tipos.length === 0) return true
  const nome = arquivo.name.toLowerCase()
  const mime = arquivo.type.toLowerCase()
  return tipos.some((tipo) => {
    if (tipo.startsWith('.')) return nome.endsWith(tipo)
    if (tipo.endsWith('/*')) return mime.startsWith(tipo.slice(0, -1))
    return mime === tipo
  })
}

const CLASSE_MODELO =
  'text-legenda text-primary inline-flex min-h-11 cursor-pointer items-center gap-1 font-bold hover:underline'

export function UploadArea({
  accept = '.csv,text/csv',
  maxBytes = DOIS_MB,
  arquivo,
  onEscolher,
  onRemover,
  onErro,
  erro,
  modeloHref,
  onBaixarModelo,
  rotuloModelo = 'Baixar modelo CSV',
  titulo = 'Arraste o arquivo CSV para cá',
  ajuda = 'ou escolha no seu aparelho. Até 2 MB, separado por ponto e vírgula, com a data em dd/mm/aaaa.',
  nomeDoTipo = 'CSV',
  disabled = false,
  className,
}: UploadAreaProps) {
  const base = useId()
  const inputId = `${base}-arquivo`
  const ajudaId = `${base}-ajuda`
  const [arrastando, setArrastando] = useState(false)
  const [erroInterno, setErroInterno] = useState<string | null>(null)
  const erroVisivel = erroInterno ?? erro ?? null
  const extensao =
    accept
      .split(',')
      .find((t) => t.trim().startsWith('.'))
      ?.trim() ?? ''

  const receber = (escolhido: File | undefined) => {
    if (!escolhido || disabled) return
    let mensagem: string | null = null
    if (!aceita(escolhido, accept)) {
      mensagem = `"${escolhido.name}" não é um arquivo ${nomeDoTipo}.${extensao ? ` Envie um arquivo ${extensao}.` : ''}`
    } else if (escolhido.size > maxBytes) {
      mensagem = `O arquivo tem ${formatarTamanho(escolhido.size)}. O limite é ${formatarTamanho(maxBytes)}: divida em arquivos menores.`
    }
    setErroInterno(mensagem)
    onErro?.(mensagem)
    if (!mensagem) onEscolher(escolhido)
  }

  const aoEscolher = (evento: ChangeEvent<HTMLInputElement>) => {
    receber(evento.target.files?.[0])
    evento.target.value = '' // permite escolher o mesmo arquivo de novo
  }

  const aoArrastar = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault()
    if (!disabled) setArrastando(true)
  }

  const aoSair = (evento: DragEvent<HTMLDivElement>) => {
    if (evento.currentTarget.contains(evento.relatedTarget as Node | null)) return
    setArrastando(false)
  }

  const aoSoltar = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault()
    setArrastando(false)
    receber(evento.dataTransfer.files?.[0])
  }

  const iconeFuncao = (erroAtivo: boolean, Icone: typeof Upload) => (
    <span
      className={cn(
        'rounded-icone inline-grid size-10 shrink-0 place-items-center',
        erroAtivo ? 'bg-secondary text-foreground' : 'bg-accent text-primary',
      )}
    >
      <Icone className="size-5" aria-hidden="true" />
    </span>
  )

  if (arquivo && !erroVisivel) {
    return (
      <div
        data-slot="upload-area"
        data-estado="escolhido"
        className={cn('border-border bg-card rounded-card flex items-center gap-3 border-2 p-4', className)}
      >
        {iconeFuncao(false, FileText)}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold">{arquivo.name}</span>
          <span className="text-legenda text-muted-foreground tabular-nums">{formatarTamanho(arquivo.size)}</span>
        </span>
        <Button
          variant="texto"
          size="icone"
          disabled={disabled}
          aria-label={`Remover arquivo ${arquivo.name}`}
          onClick={() => {
            setErroInterno(null)
            onRemover()
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <div
      data-slot="upload-area"
      data-estado={erroVisivel ? 'erro' : arrastando ? 'arrastando' : 'vazio'}
      aria-disabled={disabled || undefined}
      onDragEnter={aoArrastar}
      onDragOver={aoArrastar}
      onDragLeave={aoSair}
      onDrop={aoSoltar}
      className={cn(
        'border-input bg-card rounded-card relative flex min-h-[200px] flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-6 text-center transition-colors',
        !disabled && 'hover:border-primary focus-within:border-primary',
        arrastando && 'border-primary bg-accent border-solid',
        erroVisivel && 'border-destructive bg-erro-fundo',
        disabled && 'opacity-45',
        className,
      )}
    >
      {iconeFuncao(Boolean(erroVisivel), Upload)}
      <p className="text-corpo-forte">{arrastando ? 'Solte para enviar' : titulo}</p>
      {erroVisivel ? (
        <p role="alert" className="text-legenda text-destructive flex items-start gap-1 text-left font-semibold">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{erroVisivel}</span>
        </p>
      ) : (
        <p id={ajudaId} className="text-legenda text-muted-foreground">
          {arrastando ? `Arquivo ${extensao} de até ${formatarTamanho(maxBytes)}.` : ajuda}
        </p>
      )}
      <input
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        aria-describedby={erroVisivel ? undefined : ajudaId}
        onChange={aoEscolher}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className={cn(
          buttonVariants({ variant: 'contornado', size: 'pequeno' }),
          'peer-focus-visible:outline-ring cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
          disabled && 'pointer-events-none',
        )}
      >
        {erroVisivel ? 'Escolher outro arquivo' : 'Escolher arquivo'}
      </label>
      {onBaixarModelo ? (
        <button type="button" data-slot="upload-area-modelo" onClick={onBaixarModelo} className={CLASSE_MODELO}>
          <Download className="size-4" aria-hidden="true" />
          {rotuloModelo}
        </button>
      ) : (
        modeloHref && (
          <a href={modeloHref} download data-slot="upload-area-modelo" className={CLASSE_MODELO}>
            <Download className="size-4" aria-hidden="true" />
            {rotuloModelo}
          </a>
        )
      )}
    </div>
  )
}
