'use client'

import { ChevronRight, X, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/atoms/sheet'

// Folha "Criar" que sobe de baixo pelo + da BottomNav (DS: CreateSheet), sobre o `sheet` do shadcn (Radix Dialog):
// role="dialog" + aria-modal, título "Criar", foco preso, Esc/véu/× fecham e o foco volta ao +.
// Puro: aberto/fechado e os itens chegam por props.
export type ItemCreateSheet = {
  icone: LucideIcon
  /** Verbo ou "Novo/Nova …" */
  titulo: string
  /** Uma frase curta do que acontece */
  subtitulo: string
  /** Leva a outra tela… */
  href?: string
  /** …ou faz uma ação aqui (ex.: abrir o diálogo de categoria) */
  onSelect?: () => void
}

export type CreateSheetProps = {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  /** De 3 a 8 itens; com mais de 6, a lista rola por dentro e o título fica fixo */
  itens: ItemCreateSheet[]
}

/** Nos primeiros 300 ms depois de abrir, ignora toques (o duplo toque no + não escolhe uma opção sem querer) */
export const TRAVA_AO_ABRIR_MS = 300

const ITEM = 'rounded-card text-foreground hover:bg-secondary flex min-h-16 w-full items-center gap-3 p-2 text-left'

function Conteudo({ item }: { item: ItemCreateSheet }) {
  return (
    <>
      <span className="rounded-icone bg-accent text-accent-foreground grid size-10 shrink-0 place-items-center">
        <item.icone className="size-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-corpo-forte">{item.titulo}</span>
        <span className="text-legenda text-muted-foreground">{item.subtitulo}</span>
      </span>
      <ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
    </>
  )
}

export function CreateSheet({ aberto, onAbertoChange, itens }: CreateSheetProps) {
  const lista = useRef<HTMLUListElement>(null)
  // Quem abriu a folha (o + da BottomNav) recebe o foco de volta ao fechar; ele não é um DialogTrigger
  const quemAbriu = useRef<HTMLElement | null>(null)
  // Trava ao abrir: ajusta o estado quando `aberto` muda (durante o render) e destrava depois de 300 ms
  const [abertoAntes, setAbertoAntes] = useState(aberto)
  const [travada, setTravada] = useState(aberto)
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    setTravada(aberto)
  }

  useEffect(() => {
    if (!travada) return
    const timer = setTimeout(() => setTravada(false), TRAVA_AO_ABRIR_MS)
    return () => clearTimeout(timer)
  }, [travada])

  const fechar = () => onAbertoChange(false)

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-sobreposicao supports-backdrop-filter:backdrop-blur-none"
        data-travada={travada}
        className="rounded-t-grande bg-card text-foreground shadow-flutuante flex max-h-[85dvh] flex-col gap-2 border-0 px-4 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))]"
        // O foco começa no primeiro item (DS), não no "Fechar"
        onOpenAutoFocus={(evento) => {
          evento.preventDefault()
          quemAbriu.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          lista.current?.querySelector<HTMLElement>('a, button')?.focus()
        }}
        onCloseAutoFocus={(evento) => {
          evento.preventDefault()
          quemAbriu.current?.focus()
        }}
      >
        <span aria-hidden="true" className="rounded-pilula bg-input mb-1 h-1 w-10 self-center" />
        <div className="flex items-center justify-between gap-3 pl-2">
          <SheetTitle className="text-titulo-2">Criar</SheetTitle>
          <SheetClose
            aria-label="Fechar"
            className="rounded-pilula text-foreground hover:bg-secondary inline-grid size-11 place-items-center"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">Escolha o que você quer criar.</SheetDescription>
        <ul
          ref={lista}
          className="flex min-h-0 flex-col gap-0.5 overflow-y-auto data-[travada=true]:pointer-events-none"
          data-travada={travada}
        >
          {itens.map((item) => (
            <li key={item.titulo}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={ITEM}
                  onClick={() => {
                    item.onSelect?.()
                    fechar()
                  }}
                >
                  <Conteudo item={item} />
                </Link>
              ) : (
                <button
                  type="button"
                  className={ITEM}
                  onClick={() => {
                    item.onSelect?.()
                    fechar()
                  }}
                >
                  <Conteudo item={item} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
