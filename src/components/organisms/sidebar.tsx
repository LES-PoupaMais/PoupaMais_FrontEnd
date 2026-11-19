'use client'

import { LogOut, PanelLeft, Plus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/atoms/tooltip'
import type { GrupoNavegacao } from '@/constants/navegacao'
import { cn } from '@/lib/cn'

// Sidebar da área logada a partir de 768px (DS: Sidebar). Puro: rota ativa, modo e ações chegam por props.
// O MODO VISUAL (expandida ou trilho de 72px) é CSS, pela variante `trilho:` do AppShellTemplate; `expandida` só decide
// ARIA e tooltips (o servidor não sabe a largura). O último grupo (Conta) fica preso ao rodapé e recebe o "Sair".
export type SidebarProps = {
  grupos: GrupoNavegacao[]
  /** href do item ativo (`constants/navegacao.itemAtivo`) */
  ativo?: string
  /** A sidebar mostra os nomes agora: `aria-expanded` do botão e tooltips desligados */
  expandida: boolean
  /** Botão `panel-left` (recolher/expandir) */
  onAlternar: () => void
  /** Escolheu um destino (no tablet, a sidebar aberta por cima fecha) */
  onNavegar?: () => void
  /** Botão "Sair" do grupo Conta */
  onSair: () => void
  /** Enquanto a sessão é encerrada: "Sair" desabilitado */
  saindo?: boolean
  /** Destino do logo */
  hrefInicio: string
  /** Destino de "+ Novo lançamento" (no tablet e no computador leva direto ao formulário) */
  hrefNovo: string
  /** id do <aside> do template, para o `aria-controls` */
  idSidebar?: string
  /** Tablet com a sidebar aberta por cima: o Tab fica preso dentro dela até fechar */
  prenderFoco?: boolean
}

const ITEM =
  'rounded-campo text-muted-foreground hover:bg-secondary hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground trilho:justify-center trilho:px-0 trilho:aria-[current=page]:shadow-none flex min-h-11 w-full items-center gap-3 px-3 text-left font-semibold whitespace-nowrap aria-[current=page]:font-bold aria-[current=page]:shadow-[inset_3px_0_0_var(--primary)] disabled:cursor-not-allowed disabled:opacity-60'

const FOCAVEIS = 'a[href], button:not([disabled])'

/** Mantém o Tab dentro da sidebar (sidebar aberta por cima, DS: Acessibilidade) */
function prenderTab(evento: KeyboardEvent<HTMLElement>) {
  if (evento.key !== 'Tab') return
  // só os visíveis (o modo trilho esconde o "+" em bloco e o logo grande com CSS)
  const focaveis = [...evento.currentTarget.querySelectorAll<HTMLElement>(FOCAVEIS)].filter(
    (elemento) => elemento.checkVisibility?.() ?? true,
  )
  const primeiro = focaveis[0]
  const ultimo = focaveis.at(-1)
  if (!primeiro || !ultimo) return
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault()
    ultimo.focus()
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault()
    primeiro.focus()
  }
}

/** No trilho, o nome aparece num tooltip à direita (só visual: o nome acessível já está no item) */
function ComDica({ nome, ativa, children }: { nome: string; ativa: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {ativa && (
        <TooltipContent side="right" sideOffset={8} aria-hidden="true">
          {nome}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

function IconeDoItem({ icone: Icone }: { icone: LucideIcon }) {
  return <Icone className="size-5 shrink-0" aria-hidden="true" />
}

export function Sidebar({
  grupos,
  ativo,
  expandida,
  onAlternar,
  onNavegar,
  onSair,
  saindo = false,
  hrefInicio,
  hrefNovo,
  idSidebar = 'sidebar',
  prenderFoco = false,
}: SidebarProps) {
  const prefixo = useId()
  const dicas = !expandida

  return (
    <TooltipProvider>
      <div
        data-slot="sidebar"
        className="trilho:items-center trilho:px-3 flex flex-1 flex-col gap-6 px-4 pt-5 pb-6"
        onKeyDown={prenderFoco ? prenderTab : undefined}
      >
        <div className="trilho:flex-col trilho:gap-2 flex min-h-11 items-center justify-between gap-2">
          <Link
            href={hrefInicio}
            aria-label="PoupaMais, ir para o Dashboard"
            className="rounded-campo trilho:px-0 flex min-h-11 items-center px-2"
            onClick={onNavegar}
          >
            <Logo variante="sidebar" className="trilho:hidden" aria-hidden="true" />
            <Logo variante="cofrinho" className="trilho:inline-flex hidden" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="rounded-campo text-muted-foreground hover:bg-secondary hover:text-foreground inline-grid size-11 shrink-0 place-items-center"
            aria-label={expandida ? 'Recolher menu' : 'Expandir menu'}
            aria-expanded={expandida}
            aria-controls={idSidebar}
            onClick={onAlternar}
          >
            <PanelLeft className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* "+ Novo lançamento": em bloco na expandida, redondo no trilho (navegação: não conta como o preenchido da tela) */}
        <Link
          href={hrefNovo}
          className="bg-primary text-primary-foreground hover:bg-primaria-hover rounded-pilula trilho:hidden flex min-h-12 items-center justify-center gap-2 px-5 font-bold"
          onClick={onNavegar}
        >
          <Plus className="size-5" aria-hidden="true" />
          Novo lançamento
        </Link>
        <ComDica nome="Novo lançamento" ativa={dicas}>
          <Link
            href={hrefNovo}
            aria-label="Novo lançamento"
            className="bg-primary text-primary-foreground hover:bg-primaria-hover rounded-pilula trilho:inline-grid hidden size-12 place-items-center"
            onClick={onNavegar}
          >
            <Plus className="size-6" aria-hidden="true" />
          </Link>
        </ComDica>

        <nav aria-label="Navegação principal" className="trilho:w-full trilho:gap-3 flex flex-1 flex-col gap-6">
          {grupos.map((grupo, indice) => {
            const idTitulo = `${prefixo}-grupo-${indice}`
            const rodape = indice === grupos.length - 1
            return (
              <div key={grupo.titulo} className={cn('flex flex-col gap-0.5', rodape && 'mt-auto')}>
                {/* No trilho, o título vira um divisor fino (continua lido pelo leitor de tela) */}
                <h2
                  id={idTitulo}
                  className="text-rotulo-secao text-muted-foreground trilho:mx-2 trilho:mb-2 trilho:h-px trilho:overflow-hidden trilho:bg-border trilho:p-0 trilho:text-transparent mb-1 px-3 uppercase"
                >
                  {grupo.titulo}
                </h2>
                <ul aria-labelledby={idTitulo} className="flex flex-col gap-0.5">
                  {grupo.itens.map((item) => (
                    <li key={item.href} className="flex">
                      <ComDica nome={item.nome} ativa={dicas}>
                        <Link
                          href={item.href}
                          aria-current={item.href === ativo ? 'page' : undefined}
                          className={ITEM}
                          onClick={onNavegar}
                        >
                          <IconeDoItem icone={item.icone} />
                          <span className="trilho:sr-only">{item.nome}</span>
                        </Link>
                      </ComDica>
                    </li>
                  ))}
                  {rodape && (
                    <li className="flex">
                      <ComDica nome="Sair" ativa={dicas}>
                        <button
                          type="button"
                          className={ITEM}
                          disabled={saindo}
                          aria-busy={saindo || undefined}
                          // Sai da página: telas com alterações não salvas perguntam antes (data-confirmar-saida)
                          data-confirmar-saida=""
                          onClick={onSair}
                        >
                          <IconeDoItem icone={LogOut} />
                          <span className="trilho:sr-only">Sair</span>
                        </button>
                      </ComDica>
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </nav>
      </div>
    </TooltipProvider>
  )
}
