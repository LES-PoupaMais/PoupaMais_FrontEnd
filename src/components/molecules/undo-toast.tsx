'use client'

import { Trash2, Undo2, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// Toast do Design System com ação Desfazer e tempo visível (caso "Lixeira": "Movido para a lixeira · Desfazer", 5 s).
// O contador "5 s" e a barra fina embaixo mostram o tempo; o tempo para enquanto o mouse está em cima ou o foco está dentro.
// Quando o tempo acaba sem Desfazer, chama `onExpirar`. `role="status"` + `aria-live="polite"`.

export const DURACAO_TOAST_MS = 5000
const PASSO_MS = 100

export type UndoToastProps = {
  mensagem: string
  icone?: LucideIcon
  duracaoMs?: number
  onDesfazer: () => void
  onExpirar: () => void
  className?: string
}

export function UndoToast({
  mensagem,
  icone: Icone = Trash2,
  duracaoMs = DURACAO_TOAST_MS,
  onDesfazer,
  onExpirar,
  className,
}: UndoToastProps) {
  const [restante, setRestante] = useState(duracaoMs)
  const [mouseEmCima, setMouseEmCima] = useState(false)
  const [comFoco, setComFoco] = useState(false)
  const pausado = mouseEmCima || comFoco
  const terminou = useRef(false)
  const aoExpirar = useRef(onExpirar)
  useEffect(() => {
    aoExpirar.current = onExpirar
  }, [onExpirar])

  useEffect(() => {
    if (pausado) return
    const timer = setInterval(() => setRestante((atual) => Math.max(0, atual - PASSO_MS)), PASSO_MS)
    return () => clearInterval(timer)
  }, [pausado])

  useEffect(() => {
    if (restante > 0 || terminou.current) return
    terminou.current = true
    aoExpirar.current()
  }, [restante])

  return (
    <div
      data-slot="undo-toast"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setMouseEmCima(true)}
      onMouseLeave={() => setMouseEmCima(false)}
      onFocus={() => setComFoco(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setComFoco(false)
      }}
      className={cn(
        'rounded-card border-border bg-card text-foreground shadow-flutuante relative flex min-h-14 w-full max-w-[420px] items-center gap-2 overflow-hidden border py-2 pr-1 pl-4',
        className,
      )}
    >
      <Icone className="text-primary size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {/* DS: texto de 15px/600 (cabe em 1 linha a 390px junto do contador e do Desfazer) */}
      <p className="min-w-0 flex-1 py-2 text-[15px] leading-5 font-semibold">{mensagem}</p>
      <span aria-hidden="true" className="text-legenda text-muted-foreground min-w-5 text-right font-bold tabular-nums">
        {Math.ceil(restante / 1000)} s
      </span>
      <Button
        variant="texto"
        className="min-h-11 px-1.5"
        onClick={() => {
          terminou.current = true
          onDesfazer()
        }}
      >
        <Undo2 aria-hidden="true" />
        Desfazer
      </Button>
      <span aria-hidden="true" className="bg-secondary absolute inset-x-0 bottom-0 h-[3px]">
        <span
          data-slot="undo-toast-tempo"
          className="bg-primary block h-full transition-[width] duration-100 ease-linear"
          style={{ width: `${(restante / duracaoMs) * 100}%` }}
        />
      </span>
    </div>
  )
}

export type MostrarToastDesfazerOpcoes = Omit<UndoToastProps, 'onDesfazer' | 'onExpirar' | 'className'> & {
  onDesfazer: () => void
  /** O toast fechou sem Desfazer (tempo acabou ou a pessoa dispensou) */
  onFechar?: () => void
}

/** Abre o UndoToast no Toaster global (sonner). Ele continua aberto ao trocar de tela. Devolve o id do toast. */
export function mostrarToastDesfazer({ onDesfazer, onFechar, ...props }: MostrarToastDesfazerOpcoes) {
  let resolvido = false
  const resolver = (desfeito: boolean) => {
    if (resolvido) return
    resolvido = true
    if (desfeito) onDesfazer()
    else onFechar?.()
  }
  return toast.custom(
    (id) => (
      <UndoToast
        {...props}
        onDesfazer={() => {
          resolver(true)
          toast.dismiss(id)
        }}
        onExpirar={() => {
          resolver(false)
          toast.dismiss(id)
        }}
      />
    ),
    { duration: Number.POSITIVE_INFINITY, onDismiss: () => resolver(false) },
  )
}
