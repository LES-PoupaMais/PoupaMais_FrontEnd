'use client'

import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { cn } from '@/lib/cn'

// ConfirmDialog do Design System (AlertDialog): ações que não dá para desfazer ou que fazem perder trabalho.
// - `role="alertdialog"`, foco inicial em Cancelar (o Radix foca o Cancel), foco preso, Esc cancela, o foco volta para quem abriu;
// - Cancelar (contornado) e depois a ação destrutiva (perigo: o único botão preenchido), os dois com 48px e a mesma largura:
//   empilhados até 639px (Cancelar em cima) e lado a lado à direita a partir de 640px, com largura mínima de 120px;
// - `confirmacaoDigitada`: a pessoa digita a palavra ("EXCLUIR") para liberar o botão; o motivo fica no texto de ajuda;
// - `carregando`: botão destrutivo com spinner e desabilitado (RNF006); Esc e Cancelar não fecham durante a chamada.
// O confirmar não fecha sozinho: quem usa fecha (`aberto=false`) quando a ação terminar.
//
// Usa o primitivo do Radix direto porque o átomo `alert-dialog` ainda não existe (entra com os componentes de formulário);
// quando existir, troque os primitivos por ele mantendo esta API.

type ConfirmDialogProps = {
  aberto: boolean
  /** Chamado ao cancelar (botão ou Esc; o véu não fecha um alertdialog). Feche o diálogo aqui. */
  onCancelar: () => void
  onConfirmar: () => void
  /** Pergunta curta ("Descartar alterações?") */
  titulo: string
  /** Consequência em uma ou duas frases (nada de "Tem certeza?" sozinho) */
  texto: React.ReactNode
  /** Verbo da ação ("Descartar", "Excluir conta") */
  rotuloConfirmar: string
  rotuloCancelar?: string
  /** Palavra que a pessoa precisa digitar para liberar o botão (ex.: "EXCLUIR") */
  confirmacaoDigitada?: string
  carregando?: boolean
  /** Desabilita o confirmar por um motivo de fora (ex.: senha vazia no Excluir conta) */
  confirmarDesabilitado?: boolean
  /** Conteúdo extra entre o texto e os botões (aviso, link, campo de senha) */
  children?: React.ReactNode
  className?: string
}

function CampoConfirmacao({
  palavra,
  valor,
  onValor,
}: {
  palavra: string
  valor: string
  onValor: (v: string) => void
}) {
  const id = React.useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-rotulo-campo">
        Para confirmar, digite {palavra}
      </Label>
      <Input
        id={id}
        value={valor}
        onChange={(e) => onValor(e.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-describedby={`${id}-ajuda`}
        className="tracking-[0.04em] tabular-nums"
      />
      <span id={`${id}-ajuda`} className="text-legenda text-muted-foreground">
        O botão só libera quando o texto for igual a {palavra}.
      </span>
    </div>
  )
}

function Conteudo({
  onCancelar,
  onConfirmar,
  titulo,
  texto,
  rotuloConfirmar,
  rotuloCancelar = 'Cancelar',
  confirmacaoDigitada,
  carregando = false,
  confirmarDesabilitado = false,
  children,
  className,
}: Omit<ConfirmDialogProps, 'aberto'>) {
  // estado local: some quando o diálogo fecha (o Content desmonta), então reabrir começa vazio
  const [digitado, setDigitado] = React.useState('')
  const palavraConfere = !confirmacaoDigitada || digitado.trim() === confirmacaoDigitada

  return (
    <AlertDialogPrimitive.Content
      data-slot="confirm-dialog"
      onEscapeKeyDown={(e) => {
        if (carregando) e.preventDefault()
      }}
      className={cn(
        'rounded-grande border-border bg-card text-card-foreground shadow-flutuante fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-100 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto border p-6 outline-none',
        className,
      )}
    >
      <AlertDialogPrimitive.Title className="text-titulo-2">{titulo}</AlertDialogPrimitive.Title>
      <AlertDialogPrimitive.Description className="text-corpo text-muted-foreground">
        {texto}
      </AlertDialogPrimitive.Description>
      {children}
      {confirmacaoDigitada && <CampoConfirmacao palavra={confirmacaoDigitada} valor={digitado} onValor={setDigitado} />}
      <div
        data-slot="confirm-dialog-acoes"
        className="mt-2 grid grid-cols-1 gap-3 sm:ml-auto sm:w-fit sm:max-w-full sm:auto-cols-[minmax(120px,1fr)] sm:grid-flow-col sm:grid-cols-none"
      >
        <AlertDialogPrimitive.Cancel asChild>
          <Button
            variant="outline"
            className="text-corpo-forte h-12 w-full px-5"
            disabled={carregando}
            onClick={(e) => {
              e.preventDefault()
              onCancelar()
            }}
          >
            {rotuloCancelar}
          </Button>
        </AlertDialogPrimitive.Cancel>
        {/* Perigo: fundo erro com texto sobre-erro (o átomo button ainda não tem a variante do DS) */}
        <Button
          className="bg-destructive text-corpo-forte text-destructive-foreground hover:bg-destructive/90 h-12 w-full px-5"
          loading={carregando}
          disabled={!palavraConfere || confirmarDesabilitado}
          onClick={onConfirmar}
        >
          {rotuloConfirmar}
        </Button>
      </div>
    </AlertDialogPrimitive.Content>
  )
}

function ConfirmDialog({ aberto, onCancelar, carregando = false, ...props }: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open={aberto}
      onOpenChange={(abrir) => {
        if (!abrir && !carregando) onCancelar()
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="bg-sobreposicao fixed inset-0 z-50" />
        <Conteudo onCancelar={onCancelar} carregando={carregando} {...props} />
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
