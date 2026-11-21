'use client'

import { ChevronRight, X, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/atoms/sheet'

// Folha "Criar" que sobe de baixo pelo + da BottomNav (DS: CreateSheet), sobre o `sheet` do shadcn (Radix Dialog):
// role="dialog" + aria-modal, título "Criar", foco preso, Esc/véu/× fecham e o foco volta ao +.
// Arrastar para baixo pela alça ou pelo título fecha a folha (passou de 80px ou soltou rápido); menos que isso, ela volta.
// Com `prefers-reduced-motion`, a folha não acompanha o dedo nem volta animada: só fecha se o gesto passar do limite.
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

/** Distância (px) do arrasto para baixo que fecha a folha */
export const ARRASTO_PARA_FECHAR_PX = 80
/** Velocidade (px/ms) que fecha mesmo com arrasto curto (um "peteleco" para baixo) */
const VELOCIDADE_PARA_FECHAR = 0.5

const semMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

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

  // Arrastar para fechar (pointer events: dedo, caneta e mouse)
  const folha = useRef<HTMLDivElement>(null)
  const arrasto = useRef<{ id: number; inicioY: number; inicioT: number; dy: number } | null>(null)

  const moverFolha = (dy: number, animar: boolean) => {
    const el = folha.current
    if (!el || semMovimento()) return
    el.style.transition = animar ? 'transform 200ms ease-out' : 'none'
    el.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
  }

  const aoApertar = (evento: PointerEvent<HTMLDivElement>) => {
    if (evento.button !== 0 || (evento.target instanceof Element && evento.target.closest('button'))) return
    arrasto.current = { id: evento.pointerId, inicioY: evento.clientY, inicioT: evento.timeStamp, dy: 0 }
    evento.currentTarget.setPointerCapture?.(evento.pointerId)
  }

  const aoMover = (evento: PointerEvent<HTMLDivElement>) => {
    const atual = arrasto.current
    if (!atual || atual.id !== evento.pointerId) return
    atual.dy = Math.max(0, evento.clientY - atual.inicioY)
    moverFolha(atual.dy, false)
  }

  const aoSoltar = (evento: PointerEvent<HTMLDivElement>) => {
    const atual = arrasto.current
    if (!atual || atual.id !== evento.pointerId) return
    arrasto.current = null
    const tempo = Math.max(1, evento.timeStamp - atual.inicioT)
    if (atual.dy >= ARRASTO_PARA_FECHAR_PX || (atual.dy > 16 && atual.dy / tempo >= VELOCIDADE_PARA_FECHAR)) {
      fechar()
    } else {
      moverFolha(0, true)
    }
  }

  const aoCancelar = (evento: PointerEvent<HTMLDivElement>) => {
    if (arrasto.current?.id !== evento.pointerId) return
    arrasto.current = null
    moverFolha(0, true)
  }

  // Ao reabrir, a folha começa no lugar (sem o deslocamento do último arrasto)
  useEffect(() => {
    if (!aberto || !folha.current) return
    folha.current.style.transform = ''
    folha.current.style.transition = ''
  }, [aberto])

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent
        ref={folha}
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-sobreposicao supports-backdrop-filter:backdrop-blur-none"
        data-travada={travada}
        // Fica acima da barra inferior, que continua visível (o + vira ×); o véu cobre só o conteúdo
        className="rounded-t-grande bg-card text-foreground shadow-flutuante flex max-h-[calc(85dvh-var(--barra-inferior))] flex-col gap-2 border-0 px-4 pt-2 pb-4 data-[side=bottom]:bottom-[calc(var(--barra-inferior)+env(safe-area-inset-bottom))]"
        // Tocar no × da barra inferior não conta como "fora": quem fecha é o próprio botão (senão fecharia e abriria de novo)
        onPointerDownOutside={(evento) => {
          if (evento.target instanceof Element && evento.target.closest('[data-slot="bottom-nav"]'))
            evento.preventDefault()
        }}
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
        <div
          data-slot="create-sheet-alca"
          className="-mx-4 -mt-2 flex touch-none flex-col gap-2 px-4 pt-2 select-none"
          onPointerDown={aoApertar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoCancelar}
        >
          <span aria-hidden="true" className="rounded-pilula bg-input mb-1 h-1 w-10 self-center" />
          <div className="flex items-center justify-between gap-3 pl-2">
            <SheetTitle className="text-titulo-2 font-bold">Criar</SheetTitle>
            <SheetClose
              aria-label="Fechar"
              className="rounded-pilula text-foreground hover:bg-secondary inline-grid size-11 place-items-center"
            >
              <X className="size-5" aria-hidden="true" />
            </SheetClose>
          </div>
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
